import { MetricSourceError } from "../../../domain/errors/collection-error.js";
import type { MetricDefinition } from "../../../domain/types/metric-definition.js";
import type { MetricScope } from "../../../domain/types/metric-scope.js";
import type {
  MetricRetrievalResult,
  MetricValue,
} from "../../../domain/types/metric-value.js";
import { Service } from "../../../domain/types/service.js";
import type { TimePeriod } from "../../../domain/types/time-period.js";
import type { ForRetrievingMetrics } from "../../../ports/driven/for-retrieving-metrics.js";
import type { MetricQuery, OpenSearchResponse } from "./metric-query.js";
import {
  CardinalityMetricQuery,
  CountMetricQuery,
  SumMetricQuery,
  TermsMetricQuery,
  TermsWithSubAggMetricQuery,
} from "./metric-query.js";

/**
 * Configuration for the OpenSearch metric source.
 */
export interface OpenSearchMetricSourceConfig {
  readonly defaultAccessLogIndex: string;
  readonly afirAccessLogIndex: string;
  readonly accountNames: Record<Service, string>;
}

/**
 * Interface for making OpenSearch queries.
 * This allows us to inject the actual OpenSearch client or a mock for testing.
 */
export interface OpenSearchClient {
  makeOsQuery(
    index: string,
    method: string,
    query: string,
  ): Promise<OpenSearchResponse>;
}

/**
 * OpenSearchMetricSource implements ForRetrievingMetrics using OpenSearch as the data source.
 * All OpenSearch-specific logic (queries, extractors) is encapsulated here.
 */
export class OpenSearchMetricSource implements ForRetrievingMetrics {
  private readonly client: OpenSearchClient;
  private readonly config: OpenSearchMetricSourceConfig;

  constructor(client: OpenSearchClient, config: OpenSearchMetricSourceConfig) {
    this.client = client;
    this.config = config;
  }

  async retrieveMetric(
    scope: MetricScope,
    definition: MetricDefinition,
    period: TimePeriod,
  ): Promise<MetricValue> {
    const result = await this.retrieveMetricWithQuery(
      scope,
      definition,
      period,
    );
    return result.value;
  }

  /**
   * Retrieve a metric and also return the query used (for storage/debugging).
   */
  async retrieveMetricWithQuery(
    scope: MetricScope,
    definition: MetricDefinition,
    period: TimePeriod,
  ): Promise<MetricRetrievalResult> {
    const metricQuery = this.getMetricQuery(scope, definition);

    const query = metricQuery.buildQuery(scope, period);

    try {
      const response = await this.client.makeOsQuery(
        metricQuery.index,
        metricQuery.apiMethod,
        query,
      );
      return {
        value: metricQuery.extractValue(response),
        query,
      };
    } catch (error) {
      throw new MetricSourceError(
        `Failed to retrieve metric ${definition.name}`,
        {
          cause: error instanceof Error ? error : new Error(String(error)),
          definition,
          scope,
          inputValues: { query, index: metricQuery.index },
        },
      );
    }
  }

  private getMetricQuery(
    scope: MetricScope,
    definition: MetricDefinition,
  ): MetricQuery {
    const accessLogIndex = this.config.defaultAccessLogIndex;
    const afirAccessLogIndex = this.config.afirAccessLogIndex;

    const index =
      scope.service === Service.AFIR ? afirAccessLogIndex : accessLogIndex;

    switch (definition.name) {
      case "Http req":
        return new CountMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
        );
      case "Http req 200":
        return new CountMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "httpStatusCode:200",
        );
      case "Bytes out":
        return new SumMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "bytes",
        );
      case "Unique IPs":
        return new CardinalityMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "clientIp",
        );
      case "Top 10 Referers":
        return new TermsMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "httpReferrer.keyword",
          10,
        );
      case "Top 10 digitraffic-users":
        return new TermsMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "httpDigitrafficUser.keyword",
          100,
        );
      case "Top 10 User Agents":
        return new TermsMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "agent.keyword",
          10,
        );
      case "Top 10 IPs":
        return new TermsMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "clientIp",
          10,
          undefined,
        );
      case "Top digitraffic-users by bytes":
        return new TermsWithSubAggMetricQuery(
          this.config.accountNames,
          definition.name,
          index,
          "httpDigitrafficUser.keyword",
          "bytes",
          "sum",
          100,
        );
      default:
        throw new MetricSourceError(`Unknown metric: ${definition.name}`, {
          definition,
          scope,
        });
    }
  }
}
