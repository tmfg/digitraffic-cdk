import { readFileSync } from "node:fs";
import {
  CloudFrontClient,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  DescribeFunctionCommand,
  ListFunctionsCommand,
  TestFunctionCommand,
  UpdateFunctionCommand,
} from "@aws-sdk/client-cloudfront";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { globbySync } from "globby";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * Runs every built CloudFront Function bundle through the real AWS CloudFront
 * Functions JavaScript runtime.
 *
 * Unit tests exercise this same code under Node/Vitest, which accepts far more
 * JavaScript syntax than CloudFront's JS runtime does. A default parameter value
 * passed every unit test but crashed in production with a 503, because
 * CloudFront's JS runtime rejects that syntax at parse time (see DPO-4762).
 * This test catches that class of bug by asking AWS to actually run the code.
 *
 * Requires an explicit opt-in (set by rushx test:runtime, never by plain
 * rushx test) plus AWS credentials for a profile whose name marks it as a
 * test profile (matches isTestProfile() in src/bin/cloudfront-road.ts);
 * skipped otherwise. Run explicitly with:
 *   export AWS_PROFILE=<your-road-test-profile>
 *   rushx test:runtime
 */

// Set only by the test:runtime script, never by plain `rushx test`, so this
// suite never runs just because AWS_PROFILE happens to be set (e.g. to prod).
const RUNTIME_TEST_OPT_IN_ENV = "RUN_CLOUDFRONT_RUNTIME_TEST";

const PLACEHOLDERS: Record<string, string> = {
  EXT_PATHS_TO_REMOVE: "1",
  EXT_REDIRECT_URL: "https://example.digitraffic.fi/redirect",
};

function fillPlaceholders(code: string): string {
  return Object.entries(PLACEHOLDERS).reduce(
    (acc, [key, value]) => acc.split(key).join(value),
    code,
  );
}

// CloudFront's JS runtime has no `exports` object; production code (see
// function-creator.ts) strips the CJS export before deploying, so do the same.
function toFunctionBody(code: string): string {
  const exportIndex = code.indexOf("exports.handler");
  return exportIndex === -1 ? code : code.substring(0, exportIndex);
}

function readFunctionCode(file: string): string {
  return toFunctionBody(fillPlaceholders(readFileSync(file, "utf-8")));
}

// CloudFront's TestFunction API rejects the whole call (not just the function's
// own logic) if the event object doesn't match the declared eventType exactly
// (e.g. a viewer-request event must not include a `response` field, and a
// viewer-response function fed a request-only event would run with `undefined`
// response and fail for an unrelated reason). Map each function to the real
// event type it's associated with in behavior.ts.
function buildEvent(eventType: "viewer-request" | "viewer-response"): string {
  return JSON.stringify({
    version: "1.0",
    context: { eventType },
    viewer: { ip: "203.0.113.1" },
    request: {
      method: "GET",
      uri: "/roadnetwork/",
      querystring: {},
      headers: { host: { value: "example.digitraffic.fi" } },
    },
    ...(eventType === "viewer-response"
      ? {
          response: {
            statusCode: 200,
            statusDescription: "OK",
            headers: { "content-type": { value: "text/html" } },
          },
        }
      : {}),
  });
}

const REQUEST_EVENT = buildEvent("viewer-request");
const RESPONSE_EVENT = buildEvent("viewer-response");

// function-http-headers.ts runs on viewer-response, see behavior.ts; every
// other CloudFront Function in this project runs on viewer-request.
// Add new viewer-response functions here, or this test silently mis-tests them.
const VIEWER_RESPONSE_FUNCTIONS = new Set(["function-http-headers"]);

function eventFor(file: string): string {
  const basename = file.replace(/^.*\//, "").replace(/\.cjs$/, "");
  return VIEWER_RESPONSE_FUNCTIONS.has(basename)
    ? RESPONSE_EVENT
    : REQUEST_EVENT;
}

function readEnv(key: string): string | undefined {
  return process.env[key];
}

const awsProfile = readEnv("AWS_PROFILE");
const hasAwsCredentials = Boolean(awsProfile ?? readEnv("AWS_ACCESS_KEY_ID"));
const hasOptedIn = Boolean(readEnv(RUNTIME_TEST_OPT_IN_ENV));
// Same naming convention as isTestProfile() in src/bin/cloudfront-road.ts. If
// credentials come from raw access keys instead of a named profile, there is
// no name to check, so trust the explicit opt-in.
const isTestProfile = awsProfile
  ? awsProfile.includes("-tst") || awsProfile.includes("-test")
  : true;
const shouldRun = hasOptedIn && hasAwsCredentials;

// Only log about this suite when it was actually meant to run; plain
// `rushx test` should stay quiet about a check it never opted into.
if (hasOptedIn) {
  if (hasAwsCredentials) {
    console.info(
      `cloudfront-function-runtime.test.ts: using AWS_PROFILE=${awsProfile ?? "(none, using AWS_ACCESS_KEY_ID)"}`,
    );
  } else {
    console.warn(
      "cloudfront-function-runtime.test.ts: skipped, no AWS credentials found. " +
        "Set your AWS profile, e.g.:\n" +
        "export AWS_PROFILE=profile-name\n" +
        "then run: rushx test:runtime",
    );
  }
}

// The CloudFront Functions (as opposed to Lambda@Edge functions, named
// lambda-*.ts) all live in files named function-*.ts, see rollup.config.js.
// function-events.cjs is a shared types-only chunk with no handler, exclude it.
const functionFiles = globbySync("dist/lambda/function-*.cjs").filter((file) =>
  readFileSync(file, "utf-8").includes("exports.handler"),
);

// Only opt-in + credentials should decide whether this suite runs; an empty
// bundle list at that point means discovery is broken and should fail loudly.
if (shouldRun && functionFiles.length === 0) {
  throw new Error(
    "No built CloudFront Function bundles found under dist/lambda/function-*.cjs. Run rushx build first.",
  );
}

const FUNCTION_NAME_PREFIX = "digitraffic-cloudfront-runtime-";
const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000;

type SendableClient = { send<Output>(command: unknown): Promise<Output> };

// Best-effort cleanup for functions left behind by a killed or cancelled run
// (the normal afterAll never gets to run in that case). Never throws: a
// leftover function is a quota nuisance, not a reason to fail this run.
async function reapOrphanedFunctions(client: SendableClient): Promise<void> {
  try {
    const list = await client.send<{
      FunctionList?: {
        Items?: {
          Name?: string;
          FunctionMetadata?: { CreatedTime?: Date };
        }[];
      };
    }>(new ListFunctionsCommand({}));

    const orphans = (list.FunctionList?.Items ?? []).filter((item) => {
      const createdTime = item.FunctionMetadata?.CreatedTime;
      return (
        item.Name?.startsWith(FUNCTION_NAME_PREFIX) &&
        createdTime &&
        Date.now() - new Date(createdTime).getTime() > ORPHAN_MAX_AGE_MS
      );
    });

    for (const orphan of orphans) {
      try {
        const described = await client.send<{ ETag?: string }>(
          new DescribeFunctionCommand({ Name: orphan.Name }),
        );
        await client.send(
          new DeleteFunctionCommand({
            Name: orphan.Name,
            IfMatch: described.ETag,
          }),
        );
      } catch {
        // Best-effort: leave it for the next run if deletion fails.
      }
    }
  } catch {
    // Best-effort: listing itself failing shouldn't block the actual test.
  }
}

describe.skipIf(!shouldRun)(
  "CloudFront Functions run in the real CloudFront JS runtime",
  () => {
    const rawClient = new CloudFrontClient({ region: "us-east-1" });
    // pnpm's nested layout + this project's preserveSymlinks:true hide the
    // inherited send() type on generated AWS SDK v3 clients; cast narrowly.
    const client = rawClient as unknown as SendableClient;
    const stsClient = new STSClient({
      region: "us-east-1",
    }) as unknown as SendableClient;
    const functionName = `${FUNCTION_NAME_PREFIX}${Date.now()}-${process.pid}`;
    let etag = "";

    beforeAll(async () => {
      if (!isTestProfile) {
        throw new Error(
          `cloudfront-function-runtime.test.ts refuses to run: AWS_PROFILE "${awsProfile}" ` +
            'does not look like a test profile (expected "-tst" or "-test" in the name).',
        );
      }

      // Informational only; the test/prod decision above is by profile name,
      // matching the rest of this project (see isTestProfile above).
      const identity = await stsClient.send<{ Account?: string }>(
        new GetCallerIdentityCommand({}),
      );
      console.info(
        `cloudfront-function-runtime.test.ts: running against AWS account ${identity.Account}`,
      );

      await reapOrphanedFunctions(client);

      const functionConfig = {
        Comment: "Temporary function used by automated runtime tests",
        Runtime: "cloudfront-js-2.0" as const,
      };
      const initialCode = readFunctionCode(functionFiles[0]!);

      const created = await client.send<{ ETag?: string }>(
        new CreateFunctionCommand({
          Name: functionName,
          FunctionConfig: functionConfig,
          FunctionCode: Buffer.from(initialCode),
        }),
      );
      etag = created.ETag!;
    });

    afterAll(async () => {
      if (!etag) return;
      await client.send(
        new DeleteFunctionCommand({ Name: functionName, IfMatch: etag }),
      );
    });

    test.each(functionFiles)(
      "%s runs without a runtime error",
      async (file: string) => {
        const code = readFunctionCode(file);

        const updated = await client.send<{ ETag?: string }>(
          new UpdateFunctionCommand({
            Name: functionName,
            IfMatch: etag,
            FunctionConfig: {
              Comment: "Temporary function used by automated runtime tests",
              Runtime: "cloudfront-js-2.0",
            },
            FunctionCode: Buffer.from(code),
          }),
        );
        etag = updated.ETag!;

        const result = await client.send<{
          TestResult?: { FunctionErrorMessage?: string };
        }>(
          new TestFunctionCommand({
            Name: functionName,
            IfMatch: etag,
            EventObject: Buffer.from(eventFor(file)),
          }),
        );

        expect(result.TestResult?.FunctionErrorMessage).toBeFalsy();
      },
    );
  },
);
