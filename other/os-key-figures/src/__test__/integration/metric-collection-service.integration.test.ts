/**
 * Integration tests for MetricCollectionService.collectAndPersist method.
 *
 * These tests verify the end-to-end flow of collecting metrics from OpenSearch
 * and persisting them to MySQL.
 *
 * To run these tests:
 * 1. Start containers: npm run test:integration:setup
 * 2. Run: npm run test:integration
 * 3. Stop containers: npm run test:integration:teardown
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import ky from "ky";
import mysql from "mysql";
import { MySqlMetricStore } from "../../adapters/driven/mysql/mysql-metric-store.js";
import { OpenSearchMetricSource } from "../../adapters/driven/opensearch/opensearch-metric-source.js";
import { MetricCollectionService } from "../../domain/services/metric-collection-service.js";
import { isSuccess } from "../../domain/types/collection-result.js";
import type { MetricDefinition } from "../../domain/types/metric-definition.js";
import type { MetricScope } from "../../domain/types/metric-scope.js";
import { MetricValueType } from "../../domain/types/metric-value.js";
import { Service } from "../../domain/types/service.js";
import type { TimePeriod } from "../../domain/types/time-period.js";
import type { OpenSearchTestDocument } from "./setup.js";
import {
  clearTestIndex,
  createTestIndex,
  deleteTestIndex,
  generateTestDocuments,
  seedTestData,
  TEST_CONFIG,
  waitForOpenSearch,
} from "./setup.js";

// Test date range - last month
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const endDate = new Date(now.getFullYear(), now.getMonth(), 1);

// MySQL connection for verifying persisted data
let mysqlConnection: mysql.Connection;
let metricStore: MySqlMetricStore;

describe("Integration Tests: MetricCollectionService.collectAndPersist", () => {
  beforeAll(async () => {
    console.log("Waiting for OpenSearch...");
    await waitForOpenSearch();
    await createTestIndex();

    // Set up MySQL connection for verification
    mysqlConnection = mysql.createConnection({
      host: TEST_CONFIG.mysql.host,
      user: TEST_CONFIG.mysql.user,
      password: TEST_CONFIG.mysql.password,
      database: TEST_CONFIG.mysql.database,
    });

    // Create metric store
    metricStore = new MySqlMetricStore({
      host: TEST_CONFIG.mysql.host,
      user: TEST_CONFIG.mysql.user,
      password: TEST_CONFIG.mysql.password,
      database: TEST_CONFIG.mysql.database,
    });
  }, 60000);

  afterAll(async () => {
    await deleteTestIndex();

    if (mysqlConnection) {
      await new Promise<void>((resolve) => {
        mysqlConnection.end(() => resolve());
      });
    }

    if (metricStore) {
      await metricStore.close();
    }
  });

  beforeEach(async () => {
    await clearTestIndex();
    // Clear MySQL tables
    await clearMySqlTables();
  });

  afterEach(async () => {
    await clearMySqlTables();
  });

  describe("Basic Collection", () => {
    test("should collect and persist a single metric for a single scope", async () => {
      // Seed test data
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/"],
        count: 50,
      });
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(1);
      expect(result.errors.length).toBe(0);

      // Verify the metric was persisted
      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(1);
      expect(persistedMetrics[0]?.name).toBe("Http req");
      expect(persistedMetrics[0]?.filter).toBe("@transport_type:rail");
    }, 30000);

    test("should collect multiple metrics for a single scope", async () => {
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.road,
        startDate,
        endDate,
        paths: ["/api/v1/weathercams/"],
        count: 30,
      });
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
        { name: "Bytes out", valueType: MetricValueType.SCALAR },
        { name: "Unique IPs", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.ROAD, storageTag: "@transport_type:road" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(3);
      expect(result.errors.length).toBe(0);

      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(3);

      const metricNames = persistedMetrics.map((m) => m.name);
      expect(metricNames).toContain("Http req");
      expect(metricNames).toContain("Bytes out");
      expect(metricNames).toContain("Unique IPs");
    }, 30000);
  });

  describe("Multiple Scopes", () => {
    test("should collect metrics for multiple services", async () => {
      // Seed data for multiple services
      const railDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/"],
        count: 40,
      });
      const roadDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.road,
        startDate,
        endDate,
        paths: ["/api/v1/weathercams/"],
        count: 30,
      });
      await seedTestData([...railDocs, ...roadDocs]);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
        { service: Service.ROAD, storageTag: "@transport_type:road" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(2);

      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(2);

      const filters = persistedMetrics.map((m) => m.filter);
      expect(filters).toContain("@transport_type:rail");
      expect(filters).toContain("@transport_type:road");
    }, 30000);

    test("should collect metrics for service-level and endpoint-level scopes", async () => {
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.marine,
        startDate,
        endDate,
        paths: ["/api/v1/vessels/", "/api/v1/ports/"],
        count: 60,
      });
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.MARINE, storageTag: "@transport_type:marine" },
        {
          service: Service.MARINE,
          endpoint: "/api/v1/vessels/",
          storageTag:
            '@transport_type:marine AND @fields.request_uri:"/api/v1/vessels/"',
        },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      if (result.errors.length > 0) {
        console.log(
          "Endpoint scope test errors:",
          JSON.stringify(
            result.errors.map((e) => ({
              message: e.message,
              cause: e.cause?.message,
            })),
            null,
            2,
          ),
        );
      }

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(2);

      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(2);

      // Verify that the endpoint-level metric has fewer requests than service-level
      // since it filters to only /api/v1/vessels/ paths
      const serviceMetric = result.metrics.find(
        (m) => m.scope.storageTag === "@transport_type:marine",
      );
      const endpointMetric = result.metrics.find(
        (m) => m.scope.endpoint === "/api/v1/vessels/",
      );
      expect(serviceMetric).toBeDefined();
      expect(endpointMetric).toBeDefined();
      // Service-level should have all 60 requests
      expect(serviceMetric?.value).toBe(60);
      // Endpoint-level should have roughly half (30) since paths alternate
      expect(endpointMetric?.value).toBe(30);
    }, 30000);
  });

  describe("Different Metric Types", () => {
    test("should collect scalar and categorical metrics together", async () => {
      // Seed data with various referers for categorical metric
      const testDocs: OpenSearchTestDocument[] = [];
      const referers = [
        "https://google.com",
        "https://github.com",
        "https://example.com",
      ];
      for (let i = 0; i < 30; i++) {
        testDocs.push({
          "@timestamp": new Date(
            startDate.getTime() +
              Math.random() * (endDate.getTime() - startDate.getTime()),
          ).toISOString(),
          accountName: TEST_CONFIG.accountNames.rail,
          request: "/api/v1/trains/",
          httpHost: "rata.digitraffic.fi",
          response_status: 200,
          response_body_size: 1000,
          remote_addr: "192.168.1.1",
          skip_statistics: false,
          httpReferer: referers[i % referers.length],
        });
      }
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
        {
          name: "Top 10 Referers",
          valueType: MetricValueType.CATEGORICAL_COUNTS,
        },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(2);

      // Verify scalar metric
      const scalarMetric = result.metrics.find(
        (m) => m.definition.name === "Http req",
      );
      expect(scalarMetric).toBeDefined();
      expect(typeof scalarMetric?.value).toBe("number");

      // Verify categorical metric
      const categoricalMetric = result.metrics.find(
        (m) => m.definition.name === "Top 10 Referers",
      );
      expect(categoricalMetric).toBeDefined();
      expect(typeof categoricalMetric?.value).toBe("object");
    }, 30000);
  });

  describe("Edge Cases", () => {
    test("should handle empty scopes array", async () => {
      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    test("should handle empty metric definitions array", async () => {
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/"],
        count: 10,
      });
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    test("should handle no matching data in OpenSearch", async () => {
      // Don't seed any data - OpenSearch is empty

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      expect(isSuccess(result)).toBe(true);
      expect(result.metrics.length).toBe(1);
      // Value should be 0 when no data matches
      expect(result.metrics[0]?.value).toBe(0);
    }, 30000);
  });

  describe("Error Handling", () => {
    test("should continue collecting other metrics when one fails", async () => {
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/"],
        count: 20,
      });
      await seedTestData(testDocs);

      const metricSource = createMetricSource();
      // Include a metric that doesn't exist - should cause an error
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
        { name: "NonExistentMetric", valueType: MetricValueType.SCALAR },
        { name: "Bytes out", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      // Should have collected 2 metrics successfully
      expect(result.metrics.length).toBe(2);
      // Should have 1 error for the non-existent metric
      expect(result.errors.length).toBe(1);
      expect(isSuccess(result)).toBe(false);

      // The successful metrics should still be persisted
      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(2);
    }, 30000);
  });

  describe("Large Scale Collection", () => {
    test("should handle many scopes and metrics", async () => {
      // Seed data for multiple services
      const allDocs: OpenSearchTestDocument[] = [];
      for (const accountName of [
        TEST_CONFIG.accountNames.rail,
        TEST_CONFIG.accountNames.road,
        TEST_CONFIG.accountNames.marine,
      ]) {
        const docs = generateTestDocuments({
          accountName,
          startDate,
          endDate,
          paths: ["/api/v1/data/"],
          count: 20,
        });
        allDocs.push(...docs);
      }
      await seedTestData(allDocs);

      const metricSource = createMetricSource();
      const metricDefinitions: MetricDefinition[] = [
        { name: "Http req", valueType: MetricValueType.SCALAR },
        { name: "Bytes out", valueType: MetricValueType.SCALAR },
      ];

      const service = new MetricCollectionService(
        metricSource,
        metricStore,
        metricDefinitions,
      );

      const scopes: MetricScope[] = [
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
        { service: Service.ROAD, storageTag: "@transport_type:road" },
        { service: Service.MARINE, storageTag: "@transport_type:marine" },
      ];
      const period: TimePeriod = { from: startDate, to: endDate };

      const result = await service.collectAndPersist(scopes, period);

      // 3 scopes * 2 metrics = 6 total metrics
      expect(result.metrics.length).toBe(6);
      expect(result.errors.length).toBe(0);
      expect(isSuccess(result)).toBe(true);

      const persistedMetrics = await getPersistedMetrics();
      expect(persistedMetrics.length).toBe(6);
    }, 60000);
  });
});

// Helper functions

function createMetricSource(): OpenSearchMetricSource {
  const mockClient = {
    async makeOsQuery(
      _index: string,
      method: string,
      query: string,
    ): Promise<unknown> {
      const url = `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/${method}`;
      const response = await ky
        .post(url, {
          body: query,
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        })
        .json();
      return response;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new OpenSearchMetricSource(mockClient as any, {
    defaultAccessLogIndex: TEST_CONFIG.opensearch.index,
    afirAccessLogIndex: TEST_CONFIG.opensearch.index,
    accountNames: {
      [Service.ALL]: "*",
      [Service.RAIL]: TEST_CONFIG.accountNames.rail,
      [Service.ROAD]: TEST_CONFIG.accountNames.road,
      [Service.MARINE]: TEST_CONFIG.accountNames.marine,
      [Service.AFIR]: TEST_CONFIG.accountNames.afir,
    },
  });
}

interface PersistedMetric {
  id: number;
  from: string;
  to: string;
  name: string;
  filter: string;
  query: string;
  value: unknown;
}

async function getPersistedMetrics(): Promise<PersistedMetric[]> {
  return new Promise((resolve, reject) => {
    mysqlConnection.query("SELECT * FROM key_figures", (error, results) => {
      if (error) {
        // Table might not exist yet
        if (error.code === "ER_NO_SUCH_TABLE") {
          resolve([]);
        } else {
          reject(error);
        }
      } else {
        resolve(results as PersistedMetric[]);
      }
    });
  });
}

async function clearMySqlTables(): Promise<void> {
  return new Promise((resolve) => {
    mysqlConnection.query("DROP TABLE IF EXISTS key_figures", () => {
      mysqlConnection.query("DROP TABLE IF EXISTS duplicates", () => {
        resolve();
      });
    });
  });
}
