import { Writable } from "node:stream";
import vm from "node:vm";
import { describe, expect, test } from "vitest";
// Import from the internal module directly — these helpers are intentionally
// not exported from sqs-queue.ts to keep the public API surface clean.
import {
  getDlqCode,
  sanitizeS3BucketName,
} from "../../aws/infra/sqs-queue-internal.js";
import { DtLogger } from "../../aws/runtime/dt-logger.js";

describe("sqs-queue", () => {
  test("getDlqCode generates valid JavaScript", () => {
    const inlineCode = getDlqCode("test-bucket");
    // InlineCode stores the code in the `code` property
    const code =
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal CDK property for testing
      (inlineCode as any).code ??
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal CDK property for testing
      (inlineCode as any).inlineCode;

    expect(code).toBeDefined();
    expect(typeof code).toBe("string");

    // verify bucket name was substituted
    expect(code).toContain("test-bucket");
    expect(code).not.toContain("__bucketName__");
    expect(code).not.toContain("__upload__");
    expect(code).not.toContain("__handler__");

    // verify it's valid CJS (no import/export statements, uses require/exports)
    expect(code).toContain("require(");
    expect(code).toContain("exports.handler");
    expect(code).not.toMatch(/^import /m);

    // evaluate in a vm context with stubbed require/exports and verify
    // exports.handler is actually defined as a function after execution
    const exports: Record<string, unknown> = {};
    const stubRequire = (mod: string) => {
      if (mod === "@aws-sdk/client-s3") {
        return {
          PutObjectCommand: class {},
          S3Client: class {},
        };
      }
      throw new Error(`Unexpected require: ${mod}`);
    };
    const context = vm.createContext({
      require: stubRequire,
      exports,
      console,
      process,
    });
    vm.runInContext(code, context);
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    expect(typeof exports["handler"]).toBe("function");
  });

  test("inline logger emits same JSON keys as DtLogger.error", () => {
    // Capture DtLogger.error output
    const dtLoggerLines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        dtLoggerLines.push(chunk.toString());
        callback();
      },
    });
    const dtLogger = new DtLogger({
      lambdaName: "test-lambda",
      runTime: "test-runtime",
      writeStream: stream,
    });
    dtLogger.error({
      method: "s3.uploadToS3",
      message: "upload failed to bucket test-bucket",
    });
    const dtLoggerOutput = JSON.parse(dtLoggerLines[0]!) as Record<
      string,
      unknown
    >;

    // Capture inline DLQ logger output
    const inlineCode = getDlqCode("test-bucket");
    const code =
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal CDK property for testing
      (inlineCode as any).code ??
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal CDK property for testing
      (inlineCode as any).inlineCode;

    const inlineLoggerLines: string[] = [];
    const stubProcess = {
      env: {
        AWS_LAMBDA_FUNCTION_NAME: "test-lambda",
        AWS_EXECUTION_ENV: "test-runtime",
      },
      stdout: {
        write: (line: string) => {
          inlineLoggerLines.push(line);
        },
      },
    };
    const stubExports: Record<string, unknown> = {};
    const stubRequire = (mod: string) => {
      if (mod === "@aws-sdk/client-s3") {
        return { PutObjectCommand: class {}, S3Client: class {} };
      }
      throw new Error(`Unexpected require: ${mod}`);
    };
    const context = vm.createContext({
      require: stubRequire,
      exports: stubExports,
      console,
      process: stubProcess,
      JSON,
    });
    vm.runInContext(code, context);

    // Call the inline logger.error with the same input
    vm.runInContext(
      `logger.error({ method: "s3.uploadToS3", message: "upload failed to bucket test-bucket" })`,
      context,
    );
    const inlineOutput = JSON.parse(inlineLoggerLines[0]!) as Record<
      string,
      unknown
    >;

    // The inline logger must have the same keys that DtLogger produces
    const dtKeys = new Set(Object.keys(dtLoggerOutput));
    const inlineKeys = new Set(Object.keys(inlineOutput));
    for (const key of dtKeys) {
      expect(
        inlineKeys,
        `inline logger missing key "${key}" that DtLogger emits`,
      ).toContain(key);
    }

    // Verify key field values match
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    expect(inlineOutput["level"]).toBe(dtLoggerOutput["level"]);
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    expect(inlineOutput["lambdaName"]).toBe(dtLoggerOutput["lambdaName"]);
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    expect(inlineOutput["runtime"]).toBe(dtLoggerOutput["runtime"]);
    // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
    expect(inlineOutput["method"]).toBe(dtLoggerOutput["method"]);
  });
});

describe("sanitizeS3BucketName", () => {
  test("returns lowercase alphanumeric name unchanged", () => {
    expect(sanitizeS3BucketName("my-bucket-name")).toBe("my-bucket-name");
  });

  test("replaces invalid characters with hyphens", () => {
    expect(sanitizeS3BucketName("My_Bucket.Name")).toBe("my-bucket-name");
  });

  test("collapses consecutive hyphens", () => {
    expect(sanitizeS3BucketName("my---bucket")).toBe("my-bucket");
  });

  test("trims leading and trailing hyphens", () => {
    expect(sanitizeS3BucketName("-my-bucket-")).toBe("my-bucket");
    expect(sanitizeS3BucketName("__name__")).toBe("name");
  });

  test("short names are not truncated", () => {
    const name = "a".repeat(63);
    expect(sanitizeS3BucketName(name)).toBe(name);
    expect(sanitizeS3BucketName(name)).toHaveLength(63);
  });

  test("long names are truncated with hash suffix", () => {
    const name = "a".repeat(100);
    const result = sanitizeS3BucketName(name);
    expect(result.length).toBeLessThanOrEqual(63);
    expect(result).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  });

  test("different long names produce different bucket names", () => {
    const name1 = `${"a".repeat(50)}-stack-one-dlq`;
    const name2 = `${"a".repeat(50)}-stack-two-dlq`;
    const result1 = sanitizeS3BucketName(name1);
    const result2 = sanitizeS3BucketName(name2);
    expect(result1).not.toBe(result2);
    expect(result1.length).toBeLessThanOrEqual(63);
    expect(result2.length).toBeLessThanOrEqual(63);
  });

  test("result never starts or ends with hyphen", () => {
    const longWithHyphens = `-${"a-b".repeat(30)}-`;
    const result = sanitizeS3BucketName(longWithHyphens);
    expect(result).not.toMatch(/^-/);
    expect(result).not.toMatch(/-$/);
    expect(result.length).toBeLessThanOrEqual(63);
  });
});
