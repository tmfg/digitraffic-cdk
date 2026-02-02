import { MetricSourceError } from "../../../domain/errors/collection-error.js";
import type { MetricDefinition } from "../../../domain/types/metric-definition.js";
import type { MetricScope } from "../../../domain/types/metric-scope.js";
import type { MetricValue } from "../../../domain/types/metric-value.js";
import { Service } from "../../../domain/types/service.js";
import type { TimePeriod } from "../../../domain/types/time-period.js";
import type { ForRetrievingMetrics } from "../../../ports/driven/for-retrieving-metrics.js";
import type {
  MetricQuery,
  OpenSearchResponse,
  QueryParams,
} from "./metric-query.js";
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
  readonly defaultIndex: string;
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
 * Result from retrieving a metric, includes the query for storage.
 */
export interface MetricRetrievalResult {
  readonly value: MetricValue;
  readonly query: string;
}

/**
 * OpenSearchMetricSource implements ForRetrievingMetrics using OpenSearch as the data source.
 * All OpenSearch-specific logic (queries, extractors) is encapsulated here.
 */
export class OpenSearchMetricSource implements ForRetrievingMetrics {
  private readonly client: OpenSearchClient;
  private readonly config: OpenSearchMetricSourceConfig;
  private readonly metricQueries: Map<string, MetricQuery>;

  constructor(client: OpenSearchClient, config: OpenSearchMetricSourceConfig) {
    this.client = client;
    this.config = config;
    this.metricQueries = this.initializeMetricQueries();
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
    const metricQuery = this.metricQueries.get(definition.name);
    if (!metricQuery) {
      throw new MetricSourceError(`Unknown metric: ${definition.name}`, {
        definition,
        scope,
      });
    }

    const queryParams = this.buildQueryParams(scope, period);
    const query = metricQuery.buildQuery(queryParams);

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

  private buildQueryParams(
    scope: MetricScope,
    period: TimePeriod,
  ): QueryParams {
    const accountFilter = this.buildAccountFilter(scope.service);
    const endpointFilter = scope.endpoint
      ? `request:\\"${scope.endpoint.replace(/\/$/, "")}*\\"`
      : undefined;

    return {
      accountFilter,
      period,
      endpointFilter,
    };
  }

  private buildAccountFilter(service: Service): string {
    if (service === Service.ALL) {
      // For ALL, include all services
      const allFilters = Object.values(Service)
        .filter((service) => service !== Service.ALL)
        .map((s) => `accountName.keyword:${this.config.accountNames[s]}`)
        .join(" OR ");
      return `(${allFilters})`;
    }

    const accountName = this.config.accountNames[service];
    if (!accountName) {
      throw new MetricSourceError(
        `No account name configured for service: ${service}`,
      );
    }
    return `accountName.keyword:${accountName}`;
  }

  private initializeMetricQueries(): Map<string, MetricQuery> {
    const index = this.config.defaultIndex;

    return new Map<string, MetricQuery>([
      // Count metrics
      ["Http req", new CountMetricQuery("Http req", index)],
      [
        "Http req 200",
        new CountMetricQuery("Http req 200", index, "httpStatusCode:200"),
      ],

      // Sum/Cardinality metrics
      ["Bytes out", new SumMetricQuery("Bytes out", index, "bytes")],
      [
        "Unique IPs",
        new CardinalityMetricQuery("Unique IPs", index, "clientIp"),
      ],

      // Terms aggregation metrics (top N by count)
      [
        "Top 10 Referers",
        new TermsMetricQuery(
          "Top 10 Referers",
          index,
          "httpReferer.keyword",
          100,
        ),
      ],
      [
        "Top 10 digitraffic-users",
        new TermsMetricQuery(
          "Top 10 digitraffic-users",
          index,
          "httpDigitrafficUser.keyword",
          100,
        ),
      ],
      [
        "Top 10 User Agents",
        new TermsMetricQuery(
          "Top 10 User Agents",
          index,
          "httpUserAgent.keyword",
          100,
        ),
      ],
      [
        "Top 10 IPs",
        new TermsMetricQuery("Top 10 IPs", index, "clientIp", 100),
      ],

      // Terms with sub-aggregation (top N by nested value)
      [
        "Top digitraffic-users by bytes",
        new TermsWithSubAggMetricQuery(
          "Top digitraffic-users by bytes",
          index,
          "httpDigitrafficUser.keyword",
          "bytes",
          "sum",
          100,
        ),
      ],
    ]);
  }
}
