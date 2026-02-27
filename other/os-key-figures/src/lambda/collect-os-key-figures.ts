/**
 * Refactored Lambda handler using Hexagonal Architecture.
 */

import type { AssumeRoleRequest } from "@aws-sdk/client-sts";
import { STS } from "@aws-sdk/client-sts";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { KyResourceFetcher } from "../adapters/driven/http/ky-resource-fetcher.js";
import { MySqlMetricStore } from "../adapters/driven/mysql/mysql-metric-store.js";
import { OpenSearchMetricSource } from "../adapters/driven/opensearch/opensearch-metric-source.js";
import { RetryingMetricSource } from "../adapters/driven/opensearch/retrying-metric-source.js";
import { OpenSearch } from "../api/opensearch.js";
import { EndpointDiscoveryService } from "../domain/services/endpoint-discovery-service.js";
import { MetricCollectionService } from "../domain/services/metric-collection-service.js";
import { isSuccess } from "../domain/types/collection-result.js";
import type { MetricScope } from "../domain/types/metric-scope.js";
import {
  createEndpointScope,
  createServiceScope,
} from "../domain/types/metric-scope.js";
import { parseService, Service } from "../domain/types/service.js";
import { lastMonth } from "../domain/types/time-period.js";
import { createConfigFromEnvironment } from "./handler-config.js";

export interface KeyFigureLambdaEvent {
  readonly TRANSPORT_TYPE: string;
}

const sts = new STS({ apiVersion: "2011-06-15" });

async function assumeRole(roleArn: string): Promise<AwsCredentialIdentity> {
  const roleToAssume = {
    RoleArn: roleArn,
    RoleSessionName: "OS_Session",
    DurationSeconds: 900,
  } as AssumeRoleRequest;

  return await new Promise((resolve, reject) => {
    sts.assumeRole(roleToAssume, (err, data) => {
      if (err || !data?.Credentials) {
        reject(err);
      } else {
        resolve({
          accessKeyId: data.Credentials.AccessKeyId ?? "",
          secretAccessKey: data.Credentials.SecretAccessKey ?? "",
          sessionToken: data.Credentials.SessionToken,
        });
      }
    });
  });
}

export const handler = async (
  event: KeyFigureLambdaEvent,
): Promise<boolean> => {
  const config = createConfigFromEnvironment();
  const service = parseService(event.TRANSPORT_TYPE);
  const period = lastMonth();

  logger.info({
    message: `Starting metric collection for service: ${service}, period: ${period.from.toISOString()} -> ${period.to.toISOString()}`,
    method: "collect-os-key-figures-v2.handler",
  });

  const httpClient = new KyResourceFetcher();
  const credentials = await assumeRole(config.roleArn);
  const openSearchClient = new OpenSearch(
    config.opensearch.host,
    config.opensearch.vpcEndpoint,
    credentials,
  );

  const metricSource = new RetryingMetricSource(
    new OpenSearchMetricSource(openSearchClient, {
      defaultAccessLogIndex: config.opensearch.defaultAccessLogIndex,
      afirAccessLogIndex: config.opensearch.afirAccessLogIndex,
      accountNames: config.accountNames,
    }),
  );

  const metricStore = new MySqlMetricStore(config.database);

  const endpointDiscovery = new EndpointDiscoveryService(
    httpClient,
    config.endpoints,
  );
  const metricCollection = new MetricCollectionService(
    metricSource,
    metricStore,
    config.metricDefinitions,
  );

  try {
    const monitoredEndpoints =
      service === Service.ALL
        ? await endpointDiscovery.discoverAllEndpoints()
        : [await endpointDiscovery.discoverEndpoints(service)];

    const scopes = buildScopes(monitoredEndpoints);

    logger.info({
      message: `Collecting metrics for ${scopes.length} scopes`,
      method: "collect-os-key-figures-v2.handler",
    });

    const result = await metricCollection.collectAndPersist(scopes, period);

    if (isSuccess(result)) {
      logger.info({
        message: `Successfully collected ${result.metrics.length} metrics`,
        method: "collect-os-key-figures-v2.handler",
      });
    } else {
      logger.warn({
        message: `Collected ${result.metrics.length} metrics with ${result.errors.length} errors`,
        method: "collect-os-key-figures-v2.handler",
      });
      for (const error of result.errors) {
        logger.error({
          message: error.message,
          method: "collect-os-key-figures-v2.handler",
          stack: error.stack,
        });
      }
    }

    return true;
  } catch (error) {
    logger.error({
      message: `Failed to collect metrics: ${error instanceof Error ? error.message : String(error)}`,
      method: "collect-os-key-figures-v2.handler",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    await metricStore.close();
  }
};

function buildScopes(
  monitoredEndpoints: { service: Service; endpoints: Set<string> }[],
): MetricScope[] {
  const scopes: MetricScope[] = [];

  for (const { service, endpoints } of monitoredEndpoints) {
    scopes.push(createServiceScope(service));

    for (const endpoint of endpoints) {
      scopes.push(createEndpointScope(service, endpoint));
    }
  }

  return scopes;
}
