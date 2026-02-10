/**
 * Integration test setup utilities for OpenSearch and MySQL containers.
 *
 * Prerequisites:
 * - Docker and Docker Compose installed
 * - Run `docker compose -f src/__test__/integration/docker-compose.yml up -d` before running tests
 *
 * Or use the npm scripts:
 * - `npm run test:integration:setup` - Start containers
 * - `npm run test:integration` - Run integration tests
 * - `npm run test:integration:teardown` - Stop containers
 */

import ky from "ky";

// Test configuration - matches docker-compose.yml
export const TEST_CONFIG = {
  opensearch: {
    host: "localhost",
    port: 9200,
    index: "access-logs-test",
    get url() {
      return `http://${this.host}:${this.port}`;
    },
  },
  mysql: {
    host: "localhost",
    database: "key_figures_test",
    user: "test",
    password: "test",
  },
  // Account names for test data
  accountNames: {
    rail: "rail-test",
    road: "road-test",
    marine: "marine-test",
    afir: "afir-test",
  },
};

/**
 * Wait for OpenSearch to be ready
 */
export async function waitForOpenSearch(
  maxRetries = 30,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ky
        .get(`${TEST_CONFIG.opensearch.url}/_cluster/health`, {
          timeout: 5000,
        })
        .json<{ status: string }>();

      if (response.status === "green" || response.status === "yellow") {
        console.log(`OpenSearch is ready (status: ${response.status})`);
        return;
      }
    } catch {
      // Connection failed, retry
    }
    console.log(`Waiting for OpenSearch... (${i + 1}/${maxRetries})`);
    await sleep(delayMs);
  }
  throw new Error("OpenSearch did not become ready in time");
}

/**
 * Create the test index in OpenSearch
 */
export async function createTestIndex(): Promise<void> {
  const indexUrl = `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}`;

  // Delete index if it exists
  try {
    await ky.delete(indexUrl);
    console.log(`Deleted existing index: ${TEST_CONFIG.opensearch.index}`);
  } catch {
    // Index doesn't exist, that's fine
  }

  // Create index with mapping
  const mapping = {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        "@timestamp": { type: "date" },
        accountName: {
          type: "text",
          fields: {
            keyword: { type: "text" },
          },
        },
        request: { type: "text" },
        httpHost: { type: "text" },
        response_status: { type: "integer" },
        response_body_size: { type: "long" },
        remote_addr: { type: "ip" },
        skip_statistics: { type: "boolean" },
        log_line: { type: "text" },
        httpReferrer: { type: "text" },
        httpDigitrafficUser: { type: "text" },
        httpUserAgent: { type: "text" },
        clientIp: { type: "ip" },
        bytes: { type: "long" },
      },
    },
  };

  await ky.put(indexUrl, {
    json: mapping,
    headers: { "Content-Type": "application/json" },
  });

  console.log(`Created index: ${TEST_CONFIG.opensearch.index}`);
}

/**
 * Seed test data into OpenSearch
 */
export async function seedTestData(
  documents: OpenSearchTestDocument[],
): Promise<void> {
  const bulkUrl = `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/_bulk`;

  // Build bulk request body
  const bulkBody = `${documents
    .map((doc) => {
      const action = JSON.stringify({ index: {} });
      const document = JSON.stringify(doc);
      return `${action}\n${document}`;
    })
    .join("\n")}\n`;

  await ky.post(bulkUrl, {
    body: bulkBody,
    headers: { "Content-Type": "application/x-ndjson" },
  });

  // Refresh index to make documents searchable immediately
  await ky.post(
    `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/_refresh`,
  );

  console.log(`Seeded ${documents.length} documents into OpenSearch`);
}

/**
 * Generate test documents for a specific scenario
 */
export function generateTestDocuments(
  options: TestDataOptions,
): OpenSearchTestDocument[] {
  const documents: OpenSearchTestDocument[] = [];
  const { accountName, startDate, endDate, paths, count } = options;

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const timeRange = endTime - startTime;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(
      startTime + Math.random() * timeRange,
    ).toISOString();
    const path = paths[i % paths.length] ?? "/api/v1/default/";
    const statusCode = getRandomStatusCode();

    documents.push({
      "@timestamp": timestamp,
      accountName: accountName,
      request: `${path}`,
      httpHost: `${accountName}.digitraffic.fi`,
      response_status: statusCode,
      response_body_size: Math.floor(Math.random() * 10000) + 100,
      remote_addr: generateRandomIp(),
      skip_statistics: false,
    });
  }

  return documents;
}

/**
 * Clear all data from test index
 */
export async function clearTestIndex(): Promise<void> {
  try {
    await ky.post(
      `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/_delete_by_query`,
      {
        json: { query: { match_all: {} } },
      },
    );
    await ky.post(
      `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}/_refresh`,
    );
    console.log("Cleared test index");
  } catch {
    // Index might not exist
  }
}

/**
 * Delete the test index
 */
export async function deleteTestIndex(): Promise<void> {
  try {
    await ky.delete(
      `${TEST_CONFIG.opensearch.url}/${TEST_CONFIG.opensearch.index}`,
    );
    console.log(`Deleted index: ${TEST_CONFIG.opensearch.index}`);
  } catch {
    // Index doesn't exist
  }
}

// Helper functions

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomStatusCode(): number {
  const weights = [
    { code: 200, weight: 70 },
    { code: 304, weight: 10 },
    { code: 400, weight: 5 },
    { code: 404, weight: 10 },
    { code: 500, weight: 5 },
  ];

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { code, weight } of weights) {
    random -= weight;
    if (random <= 0) return code;
  }

  return 200;
}

function generateRandomIp(): string {
  return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Types

export interface OpenSearchTestDocument {
  "@timestamp": string;
  accountName: string;
  request: string;
  httpHost: string;
  response_status: number;
  response_body_size: number;
  remote_addr: string;
  skip_statistics: boolean;
  log_line?: string;
  httpReferrer?: string;
  httpDigitrafficUser?: string;
  httpUserAgent?: string;
  clientIp?: string;
  bytes?: number;
}

export interface TestDataOptions {
  accountName: string;
  startDate: Date;
  endDate: Date;
  paths: string[];
  count: number;
}
