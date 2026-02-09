import { MetricSourceError } from "../../../domain/errors/index.js";
import type {
  MetricScope,
  MetricValue,
  TimePeriod,
} from "../../../domain/types/index.js";
import { Service, toIsoDateRange } from "../../../domain/types/index.js";

export enum OpenSearchApiMethod {
  COUNT = "_count",
  SEARCH = "_search",
}

interface QueryParams {
  readonly accountFilter: string;
  readonly period: TimePeriod;
  readonly endpointFilter?: string;
}

export interface CountResponse {
  count: number;
}

export interface SearchResponse {
  aggregations: {
    agg: {
      value?: number;
      buckets?: Array<{
        key: string;
        doc_count: number;
        agg?: { value: number };
      }>;
    };
  };
}

export type OpenSearchResponse = CountResponse | SearchResponse;

export abstract class MetricQuery {
  constructor(
    readonly name: string,
    readonly index: string,
    readonly apiMethod: OpenSearchApiMethod,
  ) {}

  abstract buildQuery(scope: MetricScope, period: TimePeriod): string;

  abstract extractValue(response: OpenSearchResponse): MetricValue;

  getQueryForStorage(scope: MetricScope, period: TimePeriod): string {
    return this.buildQuery(scope, period);
  }
}

export abstract class AccessLogQuery extends MetricQuery {
  readonly accountNames: Record<Service, string>;
  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    apiMethod: OpenSearchApiMethod,
  ) {
    super(name, index, apiMethod);
    this.accountNames = accountNames;
  }

  protected buildBaseBoolQuery(
    scope: MetricScope,
    period: TimePeriod,
  ): {
    must: unknown[];
    must_not: unknown[];
    filter: unknown[];
  } {
    const queryParams = this.buildQueryParams(scope, period);
    const { startTime, endTime } = toIsoDateRange(queryParams.period);

    let queryString = `NOT log_line:* AND ${queryParams.accountFilter}`;
    if (queryParams.endpointFilter) {
      queryString += ` AND ${queryParams.endpointFilter}`;
    }

    return {
      must: [
        {
          query_string: {
            query: queryString,
            analyze_wildcard: true,
            time_zone: "Europe/Helsinki",
          },
        },
      ],
      must_not: [
        { term: { skip_statistics: true } },
        { wildcard: { httpHost: "*.integration.digitraffic.fi" } },
      ],
      filter: [
        {
          range: {
            "@timestamp": {
              gte: startTime,
              lte: endTime,
              format: "strict_date_optional_time",
            },
          },
        },
      ],
    };
  }

  private buildQueryParams(
    scope: MetricScope,
    period: TimePeriod,
  ): QueryParams {
    const accountFilter = this.buildAccountFilter(scope.service);
    // Use quoted phrase query for text fields - the analyzer tokenizes the path
    // and the phrase query matches the tokens in order
    const endpointFilter = scope.endpoint
      ? `request:"${scope.endpoint.replace(/\/$/, "")}*"`
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
      const allFilters = Object.values<string>(Service)
        .filter((service) => service !== Service.ALL)
        .map((s) => `accountName.keyword:${s}`)
        .join(" OR ");
      return `(${allFilters})`;
    }

    const accountName = this.accountNames[service];
    if (!accountName) {
      throw new MetricSourceError(
        `No account name configured for service: ${service}`,
      );
    }
    return `accountName.keyword:${accountName}`;
  }
}

function sanitizeKey(key: string): string {
  return key.replace(/["'\\]/g, "");
}

export class CountMetricQuery extends AccessLogQuery {
  private readonly additionalQueryCondition?: string;

  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    additionalCondition?: string,
  ) {
    super(accountNames, name, index, OpenSearchApiMethod.COUNT);
    this.additionalQueryCondition = additionalCondition;
  }

  buildQuery(scope: MetricScope, period: TimePeriod): string {
    const boolQuery = this.buildBaseBoolQuery(scope, period);
    if (this.additionalQueryCondition) {
      const queryStringClause = boolQuery.must[0] as {
        query_string: { query: string };
      };
      queryStringClause.query_string.query += ` AND ${this.additionalQueryCondition}`;
    }
    return JSON.stringify({ query: { bool: boolQuery } });
  }

  extractValue(response: OpenSearchResponse): number {
    if (!("count" in response)) {
      throw new Error("Expected COUNT response");
    }
    return response.count;
  }
}

export class SumMetricQuery extends AccessLogQuery {
  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    private readonly field: string,
  ) {
    super(accountNames, name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(scope: MetricScope, period: TimePeriod): string {
    const boolQuery = this.buildBaseBoolQuery(scope, period);
    return JSON.stringify({
      aggs: { agg: { sum: { field: this.field } } },
      query: { bool: boolQuery },
      size: 0,
    });
  }

  extractValue(response: OpenSearchResponse): number {
    if (!("aggregations" in response)) {
      throw new Error("Expected SEARCH response with aggregations");
    }
    return response.aggregations.agg.value ?? 0;
  }
}

export class CardinalityMetricQuery extends AccessLogQuery {
  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    private readonly field: string,
  ) {
    super(accountNames, name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(scope: MetricScope, period: TimePeriod): string {
    const boolQuery = this.buildBaseBoolQuery(scope, period);
    return JSON.stringify({
      aggs: { agg: { cardinality: { field: this.field } } },
      query: { bool: boolQuery },
      size: 0,
    });
  }

  extractValue(response: OpenSearchResponse): number {
    if (!("aggregations" in response)) {
      throw new Error("Expected SEARCH response with aggregations");
    }
    return response.aggregations.agg.value ?? 0;
  }
}

export class TermsMetricQuery extends AccessLogQuery {
  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    private readonly field: string,
    private readonly size: number = 10,
  ) {
    super(accountNames, name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(scope: MetricScope, period: TimePeriod): string {
    const boolQuery = this.buildBaseBoolQuery(scope, period);
    return JSON.stringify({
      aggs: {
        agg: {
          terms: {
            field: this.field,
            order: { _count: "desc" },
            missing: "__missing__",
            size: this.size,
          },
        },
      },
      query: { bool: boolQuery },
      size: 0,
    });
  }

  extractValue(response: OpenSearchResponse): Record<string, number> {
    if (!("aggregations" in response)) {
      throw new Error("Expected SEARCH response with aggregations");
    }
    const buckets = response.aggregations.agg.buckets ?? [];
    const result: Record<string, number> = {};
    for (const bucket of buckets) {
      result[sanitizeKey(bucket.key)] = bucket.doc_count;
    }
    return result;
  }
}

export class TermsWithSubAggMetricQuery extends AccessLogQuery {
  constructor(
    accountNames: Record<Service, string>,
    name: string,
    index: string,
    private readonly field: string,
    private readonly subAggField: string,
    private readonly subAggType: "sum" | "avg" | "max" | "min" = "sum",
    private readonly size: number = 100,
  ) {
    super(accountNames, name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(scope: MetricScope, period: TimePeriod): string {
    const boolQuery = this.buildBaseBoolQuery(scope, period);
    return JSON.stringify({
      aggs: {
        agg: {
          terms: {
            field: this.field,
            order: { agg: "desc" },
            missing: "__missing__",
            size: this.size,
          },
          aggs: { agg: { [this.subAggType]: { field: this.subAggField } } },
        },
      },
      query: { bool: boolQuery },
      size: 0,
    });
  }

  extractValue(response: OpenSearchResponse): Record<string, number> {
    if (!("aggregations" in response)) {
      throw new Error("Expected SEARCH response with aggregations");
    }
    const buckets = response.aggregations.agg.buckets ?? [];
    const result: Record<string, number> = {};
    for (const bucket of buckets) {
      result[sanitizeKey(bucket.key)] = bucket.agg?.value ?? 0;
    }
    return result;
  }
}
