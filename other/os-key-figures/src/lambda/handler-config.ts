import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { MySqlMetricStoreConfig } from "../adapters/driven/mysql/mysql-metric-store.js";
import type { EndpointDiscoveryConfig } from "../domain/services/endpoint-discovery-service.js";
import type { MetricDefinition } from "../domain/types/metric-definition.js";
import { MetricValueType } from "../domain/types/metric-value.js";
import { Service } from "../domain/types/service.js";
import { EnvKeys } from "../env.js";

export interface LambdaConfiguration {
  readonly roleArn: string;
  readonly opensearch: OpenSearchConfig;
  readonly database: MySqlMetricStoreConfig;
  readonly endpoints: EndpointDiscoveryConfig;
  readonly metricDefinitions: MetricDefinition[];
  readonly accountNames: Record<Service, string>;
}

export interface OpenSearchConfig {
  readonly host: string;
  readonly vpcEndpoint: string;
  readonly defaultIndex: string;
}

export function createConfigFromEnvironment(): LambdaConfiguration {
  return {
    roleArn: getEnvVariable(EnvKeys.ROLE),
    opensearch: {
      host: getEnvVariable(EnvKeys.OS_HOST),
      vpcEndpoint: getEnvVariable(EnvKeys.OS_VPC_ENDPOINT),
      defaultIndex: getEnvVariable(EnvKeys.OS_INDEX),
    },
    database: {
      host: getEnvVariable("MYSQL_ENDPOINT"),
      user: getEnvVariable("MYSQL_USERNAME"),
      password: getEnvVariable("MYSQL_PASSWORD"),
      database: getEnvVariable("MYSQL_DATABASE"),
    },
    endpoints: createEndpointDiscoveryConfig(),
    metricDefinitions: createMetricDefinitions(),
    accountNames: createAccountNames(),
  };
}

function createEndpointDiscoveryConfig(): EndpointDiscoveryConfig {
  const openApiUrls = new Map<Service, string>([
    [Service.RAIL, "https://rata.digitraffic.fi/swagger/openapi.json"],
    [Service.ROAD, "https://tie.digitraffic.fi/swagger/openapi.json"],
    [Service.MARINE, "https://meri.digitraffic.fi/swagger/openapi.json"],
    [Service.AFIR, "https://afir.digitraffic.fi/swagger/openapi.json"],
  ]);

  const customEndpoints = new Map<Service, string[]>([
    [
      Service.RAIL,
      [
        "/api/v2/graphql/",
        "/api/v1/trains/history",
        "/infra-api/",
        "/jeti-api/",
        "/history",
        "/vuosisuunnitelmat",
      ],
    ],
    [Service.ROAD, ["/*.JPG"]],
  ]);

  return { openApiUrls, customEndpoints };
}

/**
 * Creates metric definitions matching those in os-queries.ts.
 * Note: The actual query templates are internal to the OpenSearch adapter.
 */
function createMetricDefinitions(): MetricDefinition[] {
  return [
    { name: "Http req", valueType: MetricValueType.SCALAR },
    { name: "Http req 200", valueType: MetricValueType.SCALAR },
    { name: "Bytes out", valueType: MetricValueType.SCALAR },
    { name: "Unique IPs", valueType: MetricValueType.SCALAR },
    { name: "Top 10 Referers", valueType: MetricValueType.CATEGORICAL_COUNTS },
    {
      name: "Top 10 digitraffic-users",
      valueType: MetricValueType.CATEGORICAL_COUNTS,
    },
    {
      name: "Top 10 User Agents",
      valueType: MetricValueType.CATEGORICAL_COUNTS,
    },
    { name: "Top 10 IPs", valueType: MetricValueType.CATEGORICAL_COUNTS },
    {
      name: "Top digitraffic-users by bytes",
      valueType: MetricValueType.CATEGORICAL_COUNTS,
    },
  ];
}

/**
 * Creates account name mapping from environment variables.
 * These correspond to the accountName.keyword values in OpenSearch.
 */
function createAccountNames(): Record<Service, string> {
  return {
    [Service.ALL]: "*",
    [Service.RAIL]: getEnvVariable("RAIL_ACCOUNT_NAME"),
    [Service.ROAD]: getEnvVariable("ROAD_ACCOUNT_NAME"),
    [Service.MARINE]: getEnvVariable("MARINE_ACCOUNT_NAME"),
    [Service.AFIR]: getEnvVariable("AFIR_ACCOUNT_NAME"),
  };
}
