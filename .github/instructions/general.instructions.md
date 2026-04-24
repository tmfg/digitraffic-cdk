---
name: 'digitraffic-cdk repository instructions'
applyTo:  "**"
---

# Tools

The code is a monorepo and is managed by Rush v5 with pnpm.

## Monorepo Structure

```
<repo-root>/
├── rush.json                    ← Monorepo root (Rush v5, pnpm 10, Node 24)
├── biome.jsonc                  ← Shared formatting/linting config
├── lib/digitraffic-common/      ← Shared CDK library (git subtree)
├── tools/                       ← Internal tools: esbuild, rig, testing, toolchain, repo-scripts
├── template/esm/                ← New project template
├── aviation/{project}/
├── marine/{project}/
├── rail/{project}/
├── road/{project}/
└── other/{project}/
```

Projects are tagged in rush.json with: `library`, `cdk`, `internal`, and a domain tag (`marine`, `rail`, `road`, `other`, `aviation`).

## Project Directory Layout

Each CDK project follows this standard structure:

```
{domain}/{project}/
├── cdk.json                     ← "app": "node lib/bin/{project}-app.js"
├── package.json                 ← ESM ("type": "module"), depends on @digitraffic/common
├── tsconfig.json
├── src/
│   ├── bin/                     ← Hard-linked from CI repo (.gitignored)
│   │   ├── {project}-app.ts    ← CDK app entry point
│   │   └── config.ts           ← Environment configuration
│   ├── {project}-stack.ts      ← Main stack class
│   ├── lambda/                  ← Lambda handlers (each in own directory)
│   ├── dao/ or db/              ← Database access layer
│   ├── model/                   ← Domain models
│   └── service/                 ← Business logic layer
└── lib/                         ← Compiled output
```

Larger projects may also have: `internal-lambdas.ts`, `public-api.ts`, `integration-api.ts`, `canaries.ts`, `keys.ts`, `app-props.ts`, `esbuild.ts`, `api/`, `canaries/`.

## Building a project

A project can be built with rush in the project directory:

```
rushx build
```

## Running tests

Tests can be run with rush in the project directory:

```
rushx test
```

This also generates a coverage report. We recommend aiming for coverage above 50%.

## Resource Naming

### Lambda Function Names

Prefixed with the stack's `shortName` + kebab-case → PascalCase conversion:

```
{shortName}-{PascalCaseName}
```

Examples: `CountingSite-UpdateMetadataFintraffic`, `RAMI-ProcessRosmQueue`

This is enforced by `StackCheckingAspect` — all function names must start with `shortName`.

### API Paths

- Resource paths: **kebab-case** (`/api/counting-site/v2/travel-modes`)
- Query parameters: **snake_case** (`?updated_after=...`)

Both conventions enforced by `StackCheckingAspect`.

## Two Stack Abstraction Levels

### 1. DigitrafficStack (Application stacks)

Used by most projects. Provides automatic setup of:
- VPC import (from config)
- Security group import (Lambda→DB)
- Secret import (Secrets Manager)
- SNS alarm/warning topics (from SSM Parameters)
- `StackCheckingAspect` validation

### 2. Plain CDK Stack (Infrastructure/utility stacks)

Used by infrastructure services that don't need the standard application pattern:
monitoring, cloudfront, aws-github-oidc, digitraffic-statistics, os-key-figures, patchmanager, rail-infra.

## Infrastructure Invariants (StackCheckingAspect)

The `StackCheckingAspect` CDK Aspect validates all constructs at synth time. It enforces Lambda configuration (reserved concurrency, timeout, memory, supported Node.js runtime, function name prefix), stack-level rules (production flag, Solution tag), and resource security (S3 public access block, SQS encryption, log group retention). API paths must be kebab-case and query parameters snake_case.

Resources can be whitelisted via `whitelistedResources` (regex patterns) in `StackConfiguration`, which downgrades errors to warnings.

See `StackCheckingAspect` source in `@digitraffic/common` for the full list of checks and severities.

## Build Toolchain

| Tool | Purpose |
|---|---|
| Rush (v5) | Monorepo management |
| pnpm | Package manager |
| Node.js | Runtime |
| TypeScript | Language |
| AWS CDK (v2) | Infrastructure as code |
| Heft | Build orchestration (Rush rig) |
| esbuild | Lambda bundling |
| Biome | Formatting and linting |
| Vitest | Testing |

Exact versions are defined in `rush.json` and per-project `package.json`.

### Lambda Bundling

The shared `@digitraffic-cdk/esbuild` tool:
- Auto-discovers `src/lambda/**/*.ts` via globby
- Outputs ESM (`.mjs`) targeting Node 24 + ES2024
- Externalizes `@aws-sdk/*` and `pg-native`
- Generates CycloneDX SBOM per Lambda
- Enforces **5 MB max Lambda bundle size**
- Checks for banned dependencies
- Injects `createRequire` banner for CJS interop

## Common CDK Patterns

### FunctionBuilder

All Lambdas should be created via `FunctionBuilder`, which automatically add CloudWatch alarms:
- **Duration alarm** at 100% of timeout (alarm in prod, warning in non-prod)
- **Duration warning** at 85% of timeout
- **Errors alarm** on ≥1 error
- **Throttles alarm** on >0 throttles

`FunctionBuilder` additionally grants secret read access and creates default DB environment variables.

### Scheduler

EventBridge rule helpers for common schedules:
```typescript
Scheduler.everyMinute(stack, "Rule", lambda);
Scheduler.everyMinutes(stack, "Rule", 5, lambda);
Scheduler.everyHour(stack, "Rule", lambda);
Scheduler.everyDay(stack, "Rule", lambda);
```

### DigitrafficRestApi

Standard REST API Gateway setup with:
- REGIONAL endpoint
- CORS (all origins, `OPTIONS/GET/HEAD`, custom `Digitraffic-User` header)
- 404 mapping (replaces AWS "Missing Authentication Token" → "Not Found")
- Usage plan + API key creation
- SSM Parameter export for endpoint URL and API key ID
- Optional IP-based access restriction

### SQS Integration

Direct API Gateway → SQS integration via `attachQueueToApiGatewayResource`, commonly paired with:
- Main queue + Dead Letter Queue
- Optional DLQ S3 bucket for failed message archival
- Lambda SQS event source consumers

### Adding a new lambda to existing stack
- Create a new file under `src/lambda/{lambda-name}/lambda-name.ts` with the handler code.
- Create a new function in the that returns a `Function` construct using `FunctionBuilder`.
- If it's an API handler, add a new route to the `DigitrafficRestApi` construct in the stack class that points to the new function(e.g. public-api.ts).
- Add model & documentation, preferably use zod schema to create OpenAPI spec from code.

## Code Style

You can check for code style by running this in application directory:

```
biome check .
```

### Import Style

Prefer **named imports** over star/namespace imports:

```typescript
// DO
import { Stack, Tags } from "aws-cdk-lib";
import { Function, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import type { ILayerVersion } from "aws-cdk-lib/aws-lambda";

// DON'T
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
```

When a named export conflicts with a global (e.g., `Function`), use an alias:

```typescript
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
```

> **Note:** Some existing code still uses star imports for `aws-cdk-lib`, `aws-cdk-lib/aws-events`, `aws-cdk-lib/aws-events-targets`, and `aws-cdk-lib/aws-iam`. These should be converted to named imports when touched.