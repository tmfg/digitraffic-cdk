# Integration Tests

Integration tests are located at `src/__test__/integration/`. They use Docker Compose to spin up OpenSearch and MySQL
containers for testing.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 22+
- pnpm

## Running the Tests

### 1. Start the test containers

```bash
pnpm run test:integration:setup
```

This starts OpenSearch and MySQL containers in the background. Wait for them to be healthy (about 10-30 seconds).

### 2. Run the integration tests

```bash
pnpm run test:integration
```

### 3. Stop the containers when done

```bash
pnpm run test:integration:teardown
```

## One-liner (all steps)

```bash
pnpm run test:integration:setup && npm run test:integration; npm run test:integration:teardown
```

## Run only a specific test

```bash
pnpm run test:integration --test-name-pattern "TEST_NAME"
```

## Test Structure

### `docker-compose.yml`

Defines the test infrastructure:
- **OpenSearch** - Running on port 9200 with security disabled
- **MySQL** - Running on port 3306 with test database

### `setup.ts`

Test utilities including:
- `waitForOpenSearch()` - Wait for OpenSearch to be ready
- `createTestIndex()` - Create the test index with proper mappings
- `seedTestData()` - Insert test documents into OpenSearch
- `generateTestDocuments()` - Generate realistic test data
- `clearTestIndex()` - Clear all documents from test index
- `deleteTestIndex()` - Delete the test index
- `setTestEnvironment()` - Set environment variables for tests

Also has test configuration for OpenSearch and MySQL connections.

## Troubleshooting

### OpenSearch not ready

If tests fail with connection errors, ensure OpenSearch is healthy:

```bash
curl http://localhost:9200/_cluster/health
```

Should return `status: "green"` or `"yellow"`.

### MySQL not ready

Check MySQL is running:

```bash
docker compose -f src/__test__/integration/docker-compose.yml ps
```

### Port conflicts

If ports 9200 or 3306 are in use, stop conflicting services or modify `docker-compose.yml`.

### Clean restart

```bash
npm run test:integration:teardown
docker volume prune -f
npm run test:integration:setup
```
