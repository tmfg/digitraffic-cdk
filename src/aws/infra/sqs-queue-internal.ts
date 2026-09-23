/**
 * Internal helpers for DLQ lambda code generation and S3 bucket name sanitization.
 *
 * This module is intentionally separate from sqs-queue.ts so that these functions
 * are NOT part of the public API surface of the package (sqs-queue.ts is listed in
 * package.json "exports", this file is not). Tests import from here directly.
 */
import { createHash } from "node:crypto";
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { NodeJsRuntimeStreamingBlobPayloadInputTypes } from "@smithy/types";
import { InlineCode } from "aws-cdk-lib/aws-lambda";
import type { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { logger } from "../runtime/dt-logger-default.js";

// CJS format is intentional: CDK InlineCode creates index.js, which Node.js treats as CJS.
// ESM would require Code.fromAsset with an .mjs file or a bundled NodejsFunction.
const DLQ_LAMBDA_CODE = `
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

// Minimal logger that emits the same JSON schema as DtLogger so that
// existing log parsing and CloudWatch alarms keep working.
const lambdaName = process.env.AWS_LAMBDA_FUNCTION_NAME || "unknown lambda name";
const runtime = process.env.AWS_EXECUTION_ENV || "unknown runtime";
const logger = {
  error: (msg) => {
    const message = msg.method ? msg.method + " " + (msg.message || "") : msg.message || "";
    process.stdout.write(JSON.stringify({ ...msg, message, level: "ERROR", lambdaName, runtime }) + "\\n");
  }
};

const bucketName = "__bucketName__";

__upload__

__handler__

exports.handler = handler;
` as const;

const S3_BUCKET_NAME_MAX_LENGTH = 63;
const HASH_SUFFIX_LENGTH = 8;

/**
 * Sanitize a string into a valid S3 bucket name.
 * S3 bucket names must be 3–63 characters, lowercase alphanumeric or hyphens,
 * and must start and end with an alphanumeric character.
 * When truncation is needed, a stable SHA-256 hash suffix is appended so that
 * distinct input names don't collide after being cut to 63 characters.
 */
export function sanitizeS3BucketName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (sanitized.length <= S3_BUCKET_NAME_MAX_LENGTH) {
    return sanitized;
  }

  const hash = createHash("sha256")
    .update(name)
    .digest("hex")
    .substring(0, HASH_SUFFIX_LENGTH);
  const maxPrefixLength = S3_BUCKET_NAME_MAX_LENGTH - HASH_SUFFIX_LENGTH - 1;
  const prefix = sanitized.substring(0, maxPrefixLength).replace(/-$/, "");
  return `${prefix}-${hash}`;
}

export function getDlqCode(bucketName: string): InlineCode {
  const functionBody = DLQ_LAMBDA_CODE.replace("__bucketName__", bucketName)
    .replace("__upload__", uploadToS3.toString())
    .replace("__handler__", createHandler().toString());

  return new InlineCode(functionBody);
}

async function uploadToS3(
  s3: S3Client,
  bucketName: string,
  body: NodeJsRuntimeStreamingBlobPayloadInputTypes,
  objectName: string,
  cannedAcl?: ObjectCannedACL,
  contentType?: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectName,
    Body: body,
    ACL: cannedAcl,
    ContentType: contentType,
  });
  try {
    await s3.send(command);
  } catch (_error) {
    logger.error({
      method: "s3.uploadToS3",
      message: `upload failed to bucket ${bucketName}`,
    });
  }
}

// bucketName is unused, will be overridden in the actual lambda code below
const bucketName = "";

function createHandler(): SQSHandler {
  return async function handler(event: SQSEvent): Promise<void> {
    const millis = Date.now();
    const s3 = new S3Client({});
    await Promise.all(
      event.Records.map((e: SQSRecord, idx: number) => {
        return uploadToS3(s3, bucketName, e.body, `dlq-${millis}-${idx}.json`);
      }),
    );
  };
}
