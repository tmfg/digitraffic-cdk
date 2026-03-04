import { describe, expect, jest, test } from "@jest/globals";
import type {
  OpenSearchClient,
  OpenSearchMetricSourceConfig,
} from "../../adapters/driven/opensearch/index.js";
import { OpenSearchMetricSource } from "../../adapters/driven/opensearch/index.js";
import { createServiceScope } from "../../domain/types/metric-scope.js";
import { MetricValueType } from "../../domain/types/metric-value.js";
import { Service } from "../../domain/types/service.js";
import { createTimePeriod } from "../../domain/types/time-period.js";

const DEFAULT_INDEX = "access-log-default";
const AFIR_INDEX = "access-log-afir";

const TEST_CONFIG: OpenSearchMetricSourceConfig = {
  defaultAccessLogIndex: DEFAULT_INDEX,
  afirAccessLogIndex: AFIR_INDEX,
  accountNames: {
    [Service.ALL]: "*",
    [Service.RAIL]: "fintraffic-digitraffic-rail-prd",
    [Service.ROAD]: "fintraffic-digitraffic-road-prd",
    [Service.MARINE]: "fintraffic-digitraffic-marine-prd",
    [Service.AFIR]: "fintraffic-digitraffic-afir-prd",
  },
};

const TEST_PERIOD = createTimePeriod(
  new Date("2025-12-01T00:00:00.000Z"),
  new Date("2026-01-01T00:00:00.000Z"),
);

function createMockClient(): OpenSearchClient & {
  lastCallIndex: string | undefined;
  lastCallMethod: string | undefined;
  callCount: number;
} {
  const mock = {
    lastCallIndex: undefined as string | undefined,
    lastCallMethod: undefined as string | undefined,
    callCount: 0,
    makeOsQuery: jest.fn(
      async (index: string, method: string, _query: string) => {
        mock.lastCallIndex = index;
        mock.lastCallMethod = method;
        mock.callCount++;
        // Return a valid count response for _count, search response for _search
        if (method === "_count") {
          return { count: 42 };
        }
        return {
          aggregations: {
            agg: { value: 42, buckets: [] },
          },
        };
      },
    ),
  };
  return mock;
}

describe("OpenSearchMetricSource index selection", () => {
  const countMetricDef = {
    name: "Http req",
    valueType: MetricValueType.SCALAR,
  };
  const sumMetricDef = {
    name: "Bytes out",
    valueType: MetricValueType.SCALAR,
  };
  const termsMetricDef = {
    name: "Top 10 Referers",
    valueType: MetricValueType.CATEGORICAL_COUNTS,
  };

  test("Service.ALL uses multi-index (both default and afir)", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const allScope = createServiceScope(Service.ALL);

    await source.retrieveMetric(allScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallIndex).toBe(`${DEFAULT_INDEX},${AFIR_INDEX}`);
  });

  test("Service.ALL uses multi-index for all metric types", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const allScope = createServiceScope(Service.ALL);

    await source.retrieveMetric(allScope, countMetricDef, TEST_PERIOD);
    expect(client.lastCallIndex).toBe(`${DEFAULT_INDEX},${AFIR_INDEX}`);

    await source.retrieveMetric(allScope, sumMetricDef, TEST_PERIOD);
    expect(client.lastCallIndex).toBe(`${DEFAULT_INDEX},${AFIR_INDEX}`);

    await source.retrieveMetric(allScope, termsMetricDef, TEST_PERIOD);
    expect(client.lastCallIndex).toBe(`${DEFAULT_INDEX},${AFIR_INDEX}`);
  });

  test("Service.AFIR uses afir index", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const afirScope = createServiceScope(Service.AFIR);

    await source.retrieveMetric(afirScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallIndex).toBe(AFIR_INDEX);
  });

  test("Service.RAIL uses default index", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const railScope = createServiceScope(Service.RAIL);

    await source.retrieveMetric(railScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallIndex).toBe(DEFAULT_INDEX);
  });

  test("Service.ROAD uses default index", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const roadScope = createServiceScope(Service.ROAD);

    await source.retrieveMetric(roadScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallIndex).toBe(DEFAULT_INDEX);
  });

  test("Service.MARINE uses default index", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const marineScope = createServiceScope(Service.MARINE);

    await source.retrieveMetric(marineScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallIndex).toBe(DEFAULT_INDEX);
  });

  test("Service.ALL uses _count method for count metrics", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const allScope = createServiceScope(Service.ALL);

    await source.retrieveMetric(allScope, countMetricDef, TEST_PERIOD);

    expect(client.lastCallMethod).toBe("_count");
  });

  test("Service.ALL uses _search method for aggregation metrics", async () => {
    const client = createMockClient();
    const source = new OpenSearchMetricSource(client, TEST_CONFIG);
    const allScope = createServiceScope(Service.ALL);

    await source.retrieveMetric(allScope, sumMetricDef, TEST_PERIOD);

    expect(client.lastCallMethod).toBe("_search");
  });
});
