/**
 * Integration tests for the collect-os-key-figures Lambda function.
 *
 * These tests verify the current behavior before refactoring.
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
import type { OpenSearch } from "../../api/opensearch.js";
import type { TransportType } from "../../constants.js";
import type { OpenSearchTestDocument } from "./setup.js";
import {
  clearTestIndex,
  createTestIndex,
  deleteTestIndex,
  generateTestDocuments,
  seedTestData,
  setTestEnvironment,
  TEST_CONFIG,
  waitForOpenSearch,
} from "./setup.js";

// Set up test environment before importing the lambda
// This must happen before the lambda module is loaded
setTestEnvironment();

// We'll dynamically import the lambda functions after setting up environment
let getApiPaths: typeof import("../../lambda/collect-os-key-figures.js").getApiPaths;
let getOsResults: typeof import("../../lambda/collect-os-key-figures.js").getOsResults;
let getKeyFigureOsQueries: typeof import("../../lambda/collect-os-key-figures.js").getKeyFigureOsQueries;
let getPaths: typeof import("../../lambda/collect-os-key-figures.js").getPaths;

// Test date range - last month
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const endDate = new Date(now.getFullYear(), now.getMonth(), 1);

// MySQL connection for verifying persisted data
let mysqlConnection: mysql.Connection;

describe("Integration Tests: collect-os-key-figures", () => {
  beforeAll(async () => {
    // Wait for OpenSearch to be ready
    console.log("Waiting for OpenSearch...");
    await waitForOpenSearch();

    // Create test index
    await createTestIndex();

    // Import lambda functions after environment is set
    const lambda = await import("../../lambda/collect-os-key-figures.js");
    getApiPaths = lambda.getApiPaths;
    getOsResults = lambda.getOsResults;
    getKeyFigureOsQueries = lambda.getKeyFigureOsQueries;
    getPaths = lambda.getPaths;

    // Set up MySQL connection
    mysqlConnection = mysql.createConnection({
      host: TEST_CONFIG.mysql.host,
      port: TEST_CONFIG.mysql.port,
      user: TEST_CONFIG.mysql.user,
      password: TEST_CONFIG.mysql.password,
      database: TEST_CONFIG.mysql.database,
    });
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    // Clean up
    await deleteTestIndex();

    if (mysqlConnection) {
      await new Promise<void>((resolve) => {
        mysqlConnection.end(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clear test data before each test
    await clearTestIndex();
  });

  describe("Endpoint Discovery (getApiPaths, getPaths)", () => {
    test("should fetch API paths from real OpenAPI endpoints", async () => {
      // This test uses real endpoints as decided
      // Retry logic for transient network failures
      let apiPaths:
        | { transportType: TransportType; paths: Set<string> }[]
        | undefined;
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          apiPaths = await getApiPaths();
          break;
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!apiPaths) {
        throw lastError;
      }

      expect(apiPaths).toBeDefined();
      expect(Array.isArray(apiPaths)).toBe(true);
      expect(apiPaths.length).toBeGreaterThan(0);

      // Verify structure
      for (const apiPath of apiPaths) {
        expect(apiPath).toHaveProperty("transportType");
        expect(apiPath).toHaveProperty("paths");
        expect(apiPath.paths instanceof Set).toBe(true);
      }

      // Verify we have paths for expected transport types
      const transportTypes = apiPaths.map((p) => p.transportType);
      expect(transportTypes).toContain("rail");
      expect(transportTypes).toContain("road");
      expect(transportTypes).toContain("marine");
    }, 60000); // 60 second timeout for network calls with retries

    test("should parse OpenAPI paths correctly from rata.digitraffic.fi", async () => {
      // Retry logic for transient network failures
      let paths: Set<string> | undefined;
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          paths = await getPaths(
            "https://rata.digitraffic.fi/swagger/openapi.json",
          );
          break;
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!paths) {
        throw lastError;
      }

      expect(paths).toBeDefined();
      expect(paths instanceof Set).toBe(true);
      expect(paths.size).toBeGreaterThan(0);

      // Paths should end with /
      for (const path of paths) {
        expect(path.endsWith("/")).toBe(true);
      }

      // Should include some known rail API paths
      const pathArray = Array.from(paths);
      const hasTrainsPath = pathArray.some((p) => p.includes("/trains"));
      expect(hasTrainsPath).toBe(true);
    }, 15000);
  });

  describe("OpenSearch Query Execution (getOsResults)", () => {
    test("should return count for HTTP requests (count type)", async () => {
      // Seed test data
      const testDocs = generateTestDocuments({
        accountName: TEST_CONFIG.accountNames.rail,
        startDate,
        endDate,
        paths: ["/api/v1/trains/", "/api/v1/stations/"],
        count: 100,
      });
      await seedTestData(testDocs);

      // Create a mock OpenSearch API that works with local instance
      const mockOpenSearchApi = createLocalOpenSearchApi();

      // Get only the "Http req" query (count type)
      const keyFigures = getKeyFigureOsQueries().filter(
        (kf) => kf.name === "Http req",
      );

      const apiPaths = [
        {
          transportType: "rail" as const,
          paths: new Set(["/api/v1/trains/"]),
        },
      ];

      const results = await getOsResults(
        mockOpenSearchApi,
        keyFigures,
        apiPaths,
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      // Should have results for the transport type level
      const railResults = results.filter((r) =>
        r.filter.dbFilter.includes("rail"),
      );
      expect(railResults.length).toBeGreaterThan(0);

      // Value should be a number for count type
      const countResult = railResults.find((r) => r.name === "Http req");
      expect(countResult).toBeDefined();
      expect(typeof countResult?.value).toBe("number");
      expect(countResult?.value).toBeGreaterThanOrEqual(0);
    }, 30000);

    test("should return aggregation value for bytes (agg type)", async () => {
      // Seed test data with known byte sizes
      const testDocs: OpenSearchTestDocument[] = [];
      for (let i = 0; i < 50; i++) {
        testDocs.push({
          "@timestamp": new Date(
            startDate.getTime() +
              Math.random() * (endDate.getTime() - startDate.getTime()),
          ).toISOString(),
          accountName: TEST_CONFIG.accountNames.road,
          request: "GET /api/v1/data/ HTTP/1.1",
          httpHost: "tie.digitraffic.fi",
          response_status: 200,
          response_body_size: 1000, // 1000 bytes each
          remote_addr: "192.168.1.1",
          skip_statistics: false,
        });
      }
      await seedTestData(testDocs);

      const mockOpenSearchApi = createLocalOpenSearchApi();

      // Get "Bytes out" query (agg type with sum)
      const keyFigures = getKeyFigureOsQueries().filter(
        (kf) => kf.name === "Bytes out",
      );

      const apiPaths = [
        {
          transportType: "road" as const,
          paths: new Set<string>(),
        },
      ];

      const results = await getOsResults(
        mockOpenSearchApi,
        keyFigures,
        apiPaths,
      );

      const bytesResult = results.find((r) => r.name === "Bytes out");
      expect(bytesResult).toBeDefined();
      expect(typeof bytesResult?.value).toBe("number");
    }, 30000);

    test("should return distribution for field aggregation (field_agg type)", async () => {
      // Seed test data with various status codes
      const testDocs: OpenSearchTestDocument[] = [];
      const statusCodes = [200, 200, 200, 304, 404, 500];

      for (const status of statusCodes) {
        testDocs.push({
          "@timestamp": new Date(
            startDate.getTime() +
              Math.random() * (endDate.getTime() - startDate.getTime()),
          ).toISOString(),
          accountName: TEST_CONFIG.accountNames.marine,
          request: "GET /api/v1/vessels/ HTTP/1.1",
          httpHost: "meri.digitraffic.fi",
          response_status: status,
          response_body_size: 500,
          remote_addr: "10.0.0.1",
          skip_statistics: false,
        });
      }
      await seedTestData(testDocs);

      const mockOpenSearchApi = createLocalOpenSearchApi();

      // Find a field_agg type query - should exist in the query definitions
      const keyFigures = getKeyFigureOsQueries().filter(
        (kf) => kf.type === "field_agg",
      );

      // Test should fail if there are no field_agg queries defined
      expect(keyFigures.length).toBeGreaterThan(0);

      const apiPaths = [
        {
          transportType: "marine" as const,
          paths: new Set<string>(),
        },
      ];

      const results = await getOsResults(
        mockOpenSearchApi,
        keyFigures,
        apiPaths,
      );

      // For field_agg, value should be an object
      const fieldAggResult = results.find((r) => r.type === "field_agg");
      expect(fieldAggResult).toBeDefined();
      expect(typeof fieldAggResult?.value).toBe("object");
    }, 30000);

    test("should handle multiple transport types", async () => {
      // Seed data for multiple services
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

      const mockOpenSearchApi = createLocalOpenSearchApi();
      const keyFigures = getKeyFigureOsQueries().filter(
        (kf) => kf.name === "Http req",
      );

      const apiPaths = [
        { transportType: "rail" as const, paths: new Set<string>() },
        { transportType: "road" as const, paths: new Set<string>() },
      ];

      const results = await getOsResults(
        mockOpenSearchApi,
        keyFigures,
        apiPaths,
      );

      // Should have results for both transport types
      const railResults = results.filter((r) =>
        r.filter.dbFilter.includes("rail"),
      );
      const roadResults = results.filter((r) =>
        r.filter.dbFilter.includes("road"),
      );

      expect(railResults.length).toBeGreaterThan(0);
      expect(roadResults.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Key Figure Queries", () => {
    test("should return all expected key figure query definitions", () => {
      const keyFigures = getKeyFigureOsQueries();

      expect(keyFigures).toBeDefined();
      expect(Array.isArray(keyFigures)).toBe(true);
      expect(keyFigures.length).toBeGreaterThan(0);

      // Verify structure
      for (const kf of keyFigures) {
        expect(kf).toHaveProperty("name");
        expect(kf).toHaveProperty("query");
        expect(kf).toHaveProperty("type");
        expect(typeof kf.name).toBe("string");
        expect(typeof kf.query).toBe("string");
        expect(["count", "agg", "field_agg", "sub_agg"]).toContain(kf.type);
      }

      // Verify we have different types
      const types = new Set(keyFigures.map((kf) => kf.type));
      expect(types.has("count")).toBe(true);
      expect(types.has("agg")).toBe(true);
    });

    test("should have time placeholders in queries", () => {
      const keyFigures = getKeyFigureOsQueries();

      for (const kf of keyFigures) {
        expect(kf.query).toContain("START_TIME");
        expect(kf.query).toContain("END_TIME");
      }
    });

    test("should have account filter placeholder in queries", () => {
      const keyFigures = getKeyFigureOsQueries();

      for (const kf of keyFigures) {
        expect(kf.query).toContain("accountName.keyword:*");
      }
    });
  });
});

/**
 * Create a mock OpenSearch API client that works with the local test instance.
 * This bypasses AWS authentication since our test OpenSearch doesn't require it.
 * We use type assertion to satisfy the OpenSearch type requirement.
 */
function createLocalOpenSearchApi(): OpenSearch {
  const mockApi = {
    actualHost: TEST_CONFIG.opensearch.host,
    endpointHost: TEST_CONFIG.opensearch.url,
    credentials: {},

    async makeOsQuery(
      _index: string,
      method: string,
      query: string,
    ): Promise<unknown> {
      const url = `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/${method}`;

      try {
        const response = await ky
          .post(url, {
            body: query,
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          })
          .json();

        return response;
      } catch (error) {
        console.error("OpenSearch query failed:", error);
        throw error;
      }
    },

    handleResponseFromOs: () => {},
    signOsRequest: async () => ({}),
  };

  return mockApi as unknown as OpenSearch;
}
