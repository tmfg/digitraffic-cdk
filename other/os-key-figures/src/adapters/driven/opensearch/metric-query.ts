import type { MetricValue } from "../../../domain/types/metric-value.js";
import type { TimePeriod } from "../../../domain/types/time-period.js";
import { toIsoDateRange } from "../../../domain/types/time-period.js";

export enum OpenSearchApiMethod {
  COUNT = "_count",
  SEARCH = "_search",
}

export interface QueryParams {
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

  abstract buildQuery(params: QueryParams): string;
  abstract extractValue(response: OpenSearchResponse): MetricValue;

  getQueryForStorage(params: QueryParams): string {
    return this.buildQuery(params);
  }
}

function buildBaseBoolQuery(params: QueryParams): {
  must: unknown[];
  must_not: unknown[];
  filter: unknown[];
} {
  const { startTime, endTime } = toIsoDateRange(params.period);

  let queryString = `NOT log_line:* AND ${params.accountFilter}`;
  if (params.endpointFilter) {
    queryString += ` AND ${params.endpointFilter}`;
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

function sanitizeKey(key: string): string {
  return key.replace(/["'\\]/g, "");
}

export class CountMetricQuery extends MetricQuery {
  private readonly additionalQueryCondition?: string;

  constructor(name: string, index: string, additionalCondition?: string) {
    super(name, index, OpenSearchApiMethod.COUNT);
    this.additionalQueryCondition = additionalCondition;
  }

  buildQuery(params: QueryParams): string {
    const boolQuery = buildBaseBoolQuery(params);
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

export class SumMetricQuery extends MetricQuery {
  constructor(
    name: string,
    index: string,
    private readonly field: string,
  ) {
    super(name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(params: QueryParams): string {
    const boolQuery = buildBaseBoolQuery(params);
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

export class CardinalityMetricQuery extends MetricQuery {
  constructor(
    name: string,
    index: string,
    private readonly field: string,
  ) {
    super(name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(params: QueryParams): string {
    const boolQuery = buildBaseBoolQuery(params);
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

export class TermsMetricQuery extends MetricQuery {
  constructor(
    name: string,
    index: string,
    private readonly field: string,
    private readonly size: number = 10,
  ) {
    super(name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(params: QueryParams): string {
    const boolQuery = buildBaseBoolQuery(params);
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

export class TermsWithSubAggMetricQuery extends MetricQuery {
  constructor(
    name: string,
    index: string,
    private readonly field: string,
    private readonly subAggField: string,
    private readonly subAggType: "sum" | "avg" | "max" | "min" = "sum",
    private readonly size: number = 100,
  ) {
    super(name, index, OpenSearchApiMethod.SEARCH);
  }

  buildQuery(params: QueryParams): string {
    const boolQuery = buildBaseBoolQuery(params);
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
