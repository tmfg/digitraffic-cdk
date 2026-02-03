/**
 * Integration tests for the collect-os-key-figures Lambda function.
 *
 * These tests verify the refactored hexagonal architecture implementation.
 * They use real OpenSearch and MySQL containers via Docker Compose.
 *
 * To run these tests:
 * 1. Start containers: docker compose -f src/__test__/integration/docker-compose.yml up -d
 * 2. Wait for containers to be healthy
 * 3. Run: npm run test:integration
 * 4. Stop containers: docker compose -f src/__test__/integration/docker-compose.yml down
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import ky from "ky";
import mysql from "mysql";
import { KyResourceFetcher } from "../../adapters/driven/http/ky-resource-fetcher.js";
import type { OpenSearchResponse } from "../../adapters/driven/opensearch/metric-query.js";
import {
  CountMetricQuery,
  SumMetricQuery,
  TermsMetricQuery,
} from "../../adapters/driven/opensearch/metric-query.js";
import { OpenSearchMetricSource } from "../../adapters/driven/opensearch/opensearch-metric-source.js";
import { EndpointDiscoveryService } from "../../domain/services/endpoint-discovery-service.js";
import { MetricValueType } from "../../domain/types/metric-value.js";
import type { MonitoredEndpoints } from "../../domain/types/monitored-endpoints.js";
// Static imports - no longer need dynamic imports since refactored code uses constructor injection
import { Service } from "../../domain/types/service.js";
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

describe("Integration Tests: Refactored Architecture", () => {
  beforeAll(async () => {
    // Wait for OpenSearch to be ready
    console.log("Waiting for OpenSearch...");
    await waitForOpenSearch();

    // Create test index
    await createTestIndex();

    // Set up MySQL connection
    mysqlConnection = mysql.createConnection({
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
  });

  beforeEach(async () => {
    await clearTestIndex();
  });

  describe("EndpointDiscoveryService", () => {
    test("should discover endpoints from real OpenAPI specs", async () => {
      const httpClient = new KyResourceFetcher();
      const config = {
        openApiUrls: new Map([
          [Service.RAIL, "https://rata.digitraffic.fi/swagger/openapi.json"],
        ]),
        customEndpoints: new Map<typeof Service.RAIL, string[]>(),
      };

      const discoveryService = new EndpointDiscoveryService(httpClient, config);

      let endpoints: MonitoredEndpoints | undefined;
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          endpoints = await discoveryService.discoverEndpoints(Service.RAIL);
          break;
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!endpoints) {
        throw lastError;
      }

      expect(endpoints).toBeDefined();
      expect(endpoints.service).toBe(Service.RAIL);
      expect(endpoints.endpoints.size).toBeGreaterThan(0);

      // Paths should end with /
      for (const path of endpoints.endpoints) {
        expect(path.endsWith("/")).toBe(true);
      }

      // Should include known rail API paths
      const pathArray = Array.from(endpoints.endpoints);
      const hasTrainsPath = pathArray.some((p) => p.includes("/trains"));
      expect(hasTrainsPath).toBe(true);
    }, 60000);

    test("should include custom endpoints", async () => {
      const httpClient = new KyResourceFetcher();
      const customPaths = ["/api/v2/graphql/", "/custom-endpoint/"];
      const config = {
        openApiUrls: new Map<typeof Service.RAIL, string>(),
        customEndpoints: new Map([[Service.RAIL, customPaths]]),
      };

      const discoveryService = new EndpointDiscoveryService(httpClient, config);
      const endpoints = await discoveryService.discoverEndpoints(Service.RAIL);

      expect(endpoints.endpoints.has("/api/v2/graphql/")).toBe(true);
      expect(endpoints.endpoints.has("/custom-endpoint/")).toBe(true);
    });
  });

  describe("OpenSearchMetricSource with MetricQuery", () => {
    test("should return count for HTTP requests using CountMetricQuery", async () => {
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/", "/api/v1/stations/"],
        count: 100,
      });
      await seedTestData(testDocs);

      const mockClient = createLocalOpenSearchClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metricSource = new OpenSearchMetricSource(mockClient, {
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

      const scope = {
        service: Service.RAIL,
        storageTag: "@transport_type:rail",
      };
      const definition = {
        name: "Http req",
        valueType: MetricValueType.SCALAR,
      };
      const period = { from: startDate, to: endDate };

      const value = await metricSource.retrieveMetric(
        scope,
        definition,
        period,
      );

      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    }, 30000);

    test("should return sum for bytes using SumMetricQuery", async () => {
      const testDocs: OpenSearchTestDocument[] = [];
      for (let i = 0; i < 50; i++) {
        testDocs.push({
          "@timestamp": new Date(
            startDate.getTime() +
              Math.random() * (endDate.getTime() - startDate.getTime()),
          ).toISOString(),
          accountName: TEST_CONFIG.accountNames.road,
          request: "/api/v1/data",
          httpHost: "tie.digitraffic.fi",
          response_status: 200,
          response_body_size: 1000,
          remote_addr: "192.168.1.1",
          skip_statistics: false,
        });
      }
      await seedTestData(testDocs);

      const mockClient = createLocalOpenSearchClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metricSource = new OpenSearchMetricSource(mockClient, {
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

      const scope = {
        service: Service.ROAD,
        storageTag: "@transport_type:road",
      };
      const definition = {
        name: "Bytes out",
        valueType: MetricValueType.SCALAR,
      };
      const period = { from: startDate, to: endDate };

      const value = await metricSource.retrieveMetric(
        scope,
        definition,
        period,
      );

      expect(typeof value).toBe("number");
    }, 30000);

    test("should return distribution for terms aggregation using TermsMetricQuery", async () => {
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
          accountName: TEST_CONFIG.accountNames.marine,
          request: "/api/v1/vessels",
          httpHost: "meri.digitraffic.fi",
          response_status: 200,
          response_body_size: 500,
          remote_addr: "10.0.0.1",
          skip_statistics: false,
          httpReferer: referers[i % referers.length],
        });
      }
      await seedTestData(testDocs);

      const mockClient = createLocalOpenSearchClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metricSource = new OpenSearchMetricSource(mockClient, {
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

      const scope = {
        service: Service.MARINE,
        storageTag: "@transport_type:marine",
      };
      const definition = {
        name: "Top 10 Referers",
        valueType: MetricValueType.CATEGORICAL_COUNTS,
      };
      const period = { from: startDate, to: endDate };

      const value = await metricSource.retrieveMetric(
        scope,
        definition,
        period,
      );

      expect(typeof value).toBe("object");
      expect(value).not.toBeNull();
    }, 30000);

    test("should handle multiple services", async () => {
      const railDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/"],
        count: 30,
      });

      const roadDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.road,
        startDate,
        endDate,
        paths: ["/api/v1/weathercams/"],
        count: 20,
      });

      await seedTestData([...railDocs, ...roadDocs]);

      const mockClient = createLocalOpenSearchClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metricSource = new OpenSearchMetricSource(mockClient, {
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

      const definition = {
        name: "Http req",
        valueType: MetricValueType.SCALAR,
      };
      const period = { from: startDate, to: endDate };

      const railValue = await metricSource.retrieveMetric(
        { service: Service.RAIL, storageTag: "@transport_type:rail" },
        definition,
        period,
      );

      const roadValue = await metricSource.retrieveMetric(
        { service: Service.ROAD, storageTag: "@transport_type:road" },
        definition,
        period,
      );

      expect(typeof railValue).toBe("number");
      expect(typeof roadValue).toBe("number");
      expect(railValue).toBeGreaterThanOrEqual(0);
      expect(roadValue).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe("MetricQuery classes", () => {
    const accountNames = { ...TEST_CONFIG.accountNames, [Service.ALL]: "*" };
    test("CountMetricQuery should build valid query", () => {
      const query = new CountMetricQuery(
        accountNames,
        "Http req",
        TEST_CONFIG.opensearch.index,
      );
      const scope = {
        service: Service.RAIL,
        storageTag: "@transport_type:rail",
      };
      const period = { from: startDate, to: endDate };

      const queryString = query.buildQuery(scope, period);
      const parsed = JSON.parse(queryString);

      expect(parsed).toHaveProperty("query");
      expect(parsed.query).toHaveProperty("bool");
      expect(parsed.query.bool).toHaveProperty("must");
      expect(parsed.query.bool).toHaveProperty("filter");
    });

    test("SumMetricQuery should build valid aggregation query", () => {
      const query = new SumMetricQuery(
        accountNames,
        "Bytes out",
        TEST_CONFIG.opensearch.index,
        "bytes",
      );

      const scope = {
        service: Service.ROAD,
        storageTag: "@transport_type:road",
      };
      const period = { from: startDate, to: endDate };

      const queryString = query.buildQuery(scope, period);

      const parsed = JSON.parse(queryString);

      expect(parsed).toHaveProperty("aggs");
      expect(parsed.aggs).toHaveProperty("agg");
      expect(parsed.aggs.agg).toHaveProperty("sum");
      expect(parsed).toHaveProperty("size", 0);
    });

    test("TermsMetricQuery should build valid terms aggregation query", () => {
      const query = new TermsMetricQuery(
        accountNames,
        "Top 10 IPs",
        TEST_CONFIG.opensearch.index,
        "clientIp",
        10,
      );

      const scope = {
        service: Service.MARINE,
        storageTag: "@transport_type:marine",
      };
      const period = { from: startDate, to: endDate };

      const queryString = query.buildQuery(scope, period);

      const parsed = JSON.parse(queryString);

      expect(parsed).toHaveProperty("aggs");
      expect(parsed.aggs).toHaveProperty("agg");
      expect(parsed.aggs.agg).toHaveProperty("terms");
      expect(parsed.aggs.agg.terms).toHaveProperty("field", "clientIp");
      expect(parsed.aggs.agg.terms).toHaveProperty("size", 10);
    });
  });
});

/**
 * Create a mock OpenSearch client that works with the local test instance.
 */
function createLocalOpenSearchClient(): {
  makeOsQuery(
    index: string,
    method: string,
    query: string,
  ): Promise<OpenSearchResponse>;
} {
  return {
    async makeOsQuery(
      _index: string,
      method: string,
      query: string,
    ): Promise<OpenSearchResponse> {
      const url = `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/${method}`;

      try {
        const response = await ky
          .post(url, {
            body: query,
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          })
          .json<OpenSearchResponse>();

        return response;
      } catch (error) {
        console.error("OpenSearch query failed:", error);
        throw error;
      }
    },
  };
}
