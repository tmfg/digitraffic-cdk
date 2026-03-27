import { describe, expect, test, vi } from "vitest";
import { MetricCollectionService } from "../../domain/services/metric-collection-service.js";
import type { CollectedMetric } from "../../domain/types/collected-metric.js";
import { isSuccess } from "../../domain/types/collection-result.js";
import type { MetricDefinition } from "../../domain/types/metric-definition.js";
import type { MetricScope } from "../../domain/types/metric-scope.js";
import {
  createEndpointScope,
  createServiceScope,
} from "../../domain/types/metric-scope.js";
import type {
  MetricRetrievalResult,
  MetricValue,
} from "../../domain/types/metric-value.js";
import { MetricValueType } from "../../domain/types/metric-value.js";
import { Service } from "../../domain/types/service.js";
import type { TimePeriod } from "../../domain/types/time-period.js";
import { createTimePeriod } from "../../domain/types/time-period.js";
import { buildScopes } from "../../lambda/collect-os-key-figures.js";
import type { ForPersistingMetrics } from "../../ports/driven/for-persisting-metrics.js";
import type { ForRetrievingMetrics } from "../../ports/driven/for-retrieving-metrics.js";

const ALL_METRIC_DEFINITIONS: MetricDefinition[] = [
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

const TEST_PERIOD = createTimePeriod(
  new Date("2025-12-01T00:00:00.000Z"),
  new Date("2026-01-01T00:00:00.000Z"),
);

function createMockMetricSource(): ForRetrievingMetrics {
  return {
    retrieveMetric: vi.fn(
      async (
        _scope: MetricScope,
        _definition: MetricDefinition,
        _period: TimePeriod,
      ): Promise<MetricValue> => {
        return 42;
      },
    ),
    retrieveMetricWithQuery: vi.fn(
      async (
        _scope: MetricScope,
        _definition: MetricDefinition,
        _period: TimePeriod,
      ): Promise<MetricRetrievalResult> => {
        return { value: 42, query: '{"mock": "query"}' };
      },
    ),
  };
}

function createMockMetricStore(): ForPersistingMetrics & {
  persistedMetrics: CollectedMetric[];
} {
  const store = {
    persistedMetrics: [] as CollectedMetric[],
    ensureSchema: vi.fn(async () => {}),
    persist: vi.fn(async (metrics: CollectedMetric[]) => {
      store.persistedMetrics.push(...metrics);
    }),
    existsForPeriod: vi.fn(async () => false),
  };
  return store;
}

describe("handler scope building behavior", () => {
  describe("Service.ALL produces only aggregate scope", () => {
    test("Service.ALL creates exactly one scope with storageTag @transport_type:*", () => {
      const allScope = createServiceScope(Service.ALL);

      expect(allScope.service).toBe(Service.ALL);
      expect(allScope.storageTag).toBe("@transport_type:*");
      expect(allScope.endpoint).toBeUndefined();
    });

    test("collecting with Service.ALL scope produces exactly 9 metrics", async () => {
      const mockSource = createMockMetricSource();
      const mockStore = createMockMetricStore();
      const service = new MetricCollectionService(
        mockSource,
        mockStore,
        ALL_METRIC_DEFINITIONS,
      );

      const scopes = [createServiceScope(Service.ALL)];
      const result = await service.collectAndPersist(scopes, TEST_PERIOD);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(9);

      // Verify all metrics have the ALL storage tag
      for (const metric of result.metrics) {
        expect(metric.scope.storageTag).toBe("@transport_type:*");
        expect(metric.scope.service).toBe(Service.ALL);
        expect(metric.scope.endpoint).toBeUndefined();
      }

      // Verify all metric names are present
      const metricNames = result.metrics.map((m) => m.definition.name);
      expect(metricNames).toEqual(
        expect.arrayContaining([
          "Http req",
          "Http req 200",
          "Bytes out",
          "Unique IPs",
          "Top 10 Referers",
          "Top 10 digitraffic-users",
          "Top 10 User Agents",
          "Top 10 IPs",
          "Top digitraffic-users by bytes",
        ]),
      );

      // Verify metrics were persisted
      expect(mockStore.persistedMetrics.length).toBe(9);
    });
  });

  describe("individual service scopes", () => {
    test("Service.RAIL scope has correct storageTag", () => {
      const scope = createServiceScope(Service.RAIL);
      expect(scope.storageTag).toBe("@transport_type:rail");
      expect(scope.service).toBe(Service.RAIL);
      expect(scope.endpoint).toBeUndefined();
    });

    test("Service.ROAD scope has correct storageTag", () => {
      const scope = createServiceScope(Service.ROAD);
      expect(scope.storageTag).toBe("@transport_type:road");
    });

    test("Service.MARINE scope has correct storageTag", () => {
      const scope = createServiceScope(Service.MARINE);
      expect(scope.storageTag).toBe("@transport_type:marine");
    });

    test("Service.AFIR scope has correct storageTag", () => {
      const scope = createServiceScope(Service.AFIR);
      expect(scope.storageTag).toBe("@transport_type:afir");
    });

    test("endpoint scope has correct storageTag format", () => {
      const scope = createEndpointScope(Service.RAIL, "/api/v1/trains/");
      expect(scope.storageTag).toBe(
        '@transport_type:rail AND @fields.request_uri:"/api/v1/trains/"',
      );
      expect(scope.service).toBe(Service.RAIL);
      expect(scope.endpoint).toBe("/api/v1/trains/");
    });

    test("individual service collection produces metrics per scope + endpoint", async () => {
      const mockSource = createMockMetricSource();
      const mockStore = createMockMetricStore();
      const service = new MetricCollectionService(
        mockSource,
        mockStore,
        ALL_METRIC_DEFINITIONS,
      );

      // Simulate: 1 service-level scope + 2 endpoint scopes
      const scopes = [
        createServiceScope(Service.RAIL),
        createEndpointScope(Service.RAIL, "/api/v1/trains/"),
        createEndpointScope(Service.RAIL, "/api/v2/graphql/"),
      ];
      const result = await service.collectAndPersist(scopes, TEST_PERIOD);

      expect(isSuccess(result)).toBe(true);
      // 3 scopes × 9 definitions = 27 metrics
      expect(result.metrics.length).toBe(27);

      // Verify service-level metrics
      const serviceMetrics = result.metrics.filter(
        (m) => m.scope.storageTag === "@transport_type:rail",
      );
      expect(serviceMetrics.length).toBe(9);

      // Verify endpoint-level metrics
      const endpointMetrics = result.metrics.filter(
        (m) => m.scope.endpoint !== undefined,
      );
      expect(endpointMetrics.length).toBe(18);
    });
  });
});

describe("buildScopes endpoint group splitting", () => {
  const endpoints = new Set(["/api/d/", "/api/b/", "/api/a/", "/api/c/"]);

  test("no group params returns service scope + all endpoints", () => {
    const scopes = buildScopes([{ service: Service.ROAD, endpoints }]);

    expect(scopes.length).toBe(5); // 1 service + 4 endpoints
    expect(scopes[0]!.endpoint).toBeUndefined();
    expect(scopes[0]!.storageTag).toBe("@transport_type:road");

    // endpoints should be sorted alphabetically
    const endpointPaths = scopes.slice(1).map((s) => s.endpoint);
    expect(endpointPaths).toEqual(["/api/a/", "/api/b/", "/api/c/", "/api/d/"]);
  });

  test("group 1 of 2 includes service scope + first half of sorted endpoints", () => {
    const scopes = buildScopes([{ service: Service.ROAD, endpoints }], 1, 2);

    // 1 service + 2 endpoints (ceil(4/2) = 2)
    expect(scopes.length).toBe(3);
    expect(scopes[0]!.endpoint).toBeUndefined();
    expect(scopes[1]!.endpoint).toBe("/api/a/");
    expect(scopes[2]!.endpoint).toBe("/api/b/");
  });

  test("group 2 of 2 has no service scope and second half of sorted endpoints", () => {
    const scopes = buildScopes([{ service: Service.ROAD, endpoints }], 2, 2);

    // 0 service + 2 endpoints
    expect(scopes.length).toBe(2);
    expect(scopes[0]!.endpoint).toBe("/api/c/");
    expect(scopes[1]!.endpoint).toBe("/api/d/");
  });

  test("groups 1 and 2 together cover all endpoints exactly once", () => {
    const scopes1 = buildScopes([{ service: Service.ROAD, endpoints }], 1, 2);
    const scopes2 = buildScopes([{ service: Service.ROAD, endpoints }], 2, 2);

    const allEndpoints = [
      ...scopes1.filter((s) => s.endpoint).map((s) => s.endpoint),
      ...scopes2.filter((s) => s.endpoint).map((s) => s.endpoint),
    ];
    expect(allEndpoints.sort()).toEqual([
      "/api/a/",
      "/api/b/",
      "/api/c/",
      "/api/d/",
    ]);
  });

  test("odd number of endpoints distributes correctly across 2 groups", () => {
    const oddEndpoints = new Set(["/api/a/", "/api/b/", "/api/c/"]);
    const scopes1 = buildScopes(
      [{ service: Service.ROAD, endpoints: oddEndpoints }],
      1,
      2,
    );
    const scopes2 = buildScopes(
      [{ service: Service.ROAD, endpoints: oddEndpoints }],
      2,
      2,
    );

    // Group 1: service + ceil(3/2) = 2 endpoints
    expect(scopes1.length).toBe(3);
    // Group 2: 1 endpoint
    expect(scopes2.length).toBe(1);

    const allEndpoints = [
      ...scopes1.filter((s) => s.endpoint).map((s) => s.endpoint),
      ...scopes2.filter((s) => s.endpoint).map((s) => s.endpoint),
    ];
    expect(allEndpoints.sort()).toEqual(["/api/a/", "/api/b/", "/api/c/"]);
  });

  test("3 groups split endpoints correctly", () => {
    const manyEndpoints = new Set([
      "/api/a/",
      "/api/b/",
      "/api/c/",
      "/api/d/",
      "/api/e/",
    ]);
    const scopes1 = buildScopes(
      [{ service: Service.ROAD, endpoints: manyEndpoints }],
      1,
      3,
    );
    const scopes2 = buildScopes(
      [{ service: Service.ROAD, endpoints: manyEndpoints }],
      2,
      3,
    );
    const scopes3 = buildScopes(
      [{ service: Service.ROAD, endpoints: manyEndpoints }],
      3,
      3,
    );

    // Group 1: service scope + ceil(5/3) = 2 endpoints
    expect(scopes1.length).toBe(3);
    expect(scopes1[0]!.endpoint).toBeUndefined();
    // Group 2: 2 endpoints
    expect(scopes2.length).toBe(2);
    // Group 3: 1 endpoint
    expect(scopes3.length).toBe(1);

    const allEndpoints = [
      ...scopes1.filter((s) => s.endpoint).map((s) => s.endpoint),
      ...scopes2.filter((s) => s.endpoint).map((s) => s.endpoint),
      ...scopes3.filter((s) => s.endpoint).map((s) => s.endpoint),
    ];
    expect(allEndpoints.sort()).toEqual([
      "/api/a/",
      "/api/b/",
      "/api/c/",
      "/api/d/",
      "/api/e/",
    ]);
  });
});
