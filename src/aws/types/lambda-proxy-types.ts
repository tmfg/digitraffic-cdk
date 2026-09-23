import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import etag from "etag";
import { compressBuffer, decodeBase64ToUtf8 } from "../../utils/base64.js";
import { truncateMiddle } from "../../utils/logging.js";
import { StopWatch } from "../../utils/stop-watch.js";
import { logger } from "../runtime/dt-logger-default.js";
import { MediaType } from "./mediatypes.js";

export const MAX_LAMBDA_PAYLOAD_BYTES = 6 * 1024 * 1024; // 6 MiB

export const REDIRECTION_HTTP_STATUS_CODES = [301, 302, 303, 307, 308] as const;

export type RedirectionStatusCode =
  (typeof REDIRECTION_HTTP_STATUS_CODES)[number];

/**
 * Used to build APIGatewayProxyResult response for Lambda proxy integration.
 * Default status is 200, compressed = false and contentType is application/json.
 */
export class LambdaProxyResponseBuilder {
  body?: string;
  isBase64Encoded: boolean = false;
  etag?: string;
  fileName?: string;
  timestamp?: Date;
  location?: string;
  compressBody: boolean = false;
  status: number = 200;
  contentType: string = MediaType.APPLICATION_JSON;
  debug: boolean = false;
  private sizeUncompressedBase64Bytes?: number;
  private sizeCompressedBase64Bytes?: number;

  static create(
    body: object | string = "",
    isBase64Encoded: boolean = false,
  ): LambdaProxyResponseBuilder {
    const builder = new LambdaProxyResponseBuilder();
    if (body !== undefined) {
      builder.withBody(body, isBase64Encoded);
    }

    return builder;
  }

  withBody(body: object | string, isBase64Encoded: boolean = false) {
    if (isBase64Encoded && typeof body !== "string") {
      throw new Error(
        "Body must be a base64 encoded string when isBase64Encoded is true",
      );
    }
    // Either body as is or stringify object
    this.body = typeof body === "string" ? body : JSON.stringify(body);
    this.isBase64Encoded = isBase64Encoded;
    // create strong etag by default from original body
    this.etag = this.isBase64Encoded
      ? decodeBase64ToUtf8(this.body)
      : etag(this.body);
    return this;
  }

  withFileName(fileName: string): LambdaProxyResponseBuilder {
    this.fileName = fileName;
    return this;
  }
  withStatus(status: number): LambdaProxyResponseBuilder {
    this.status = status;
    return this;
  }

  withTimestamp(
    timestamp: Date | string | undefined,
  ): LambdaProxyResponseBuilder {
    if (timestamp !== undefined) {
      if (typeof timestamp === "string") {
        // Convert string to Date
        this.timestamp = new Date(timestamp);
      } else {
        this.timestamp = timestamp;
      }
    }
    return this;
  }

  withCompression(enabled: boolean = true): LambdaProxyResponseBuilder {
    if (this.isBase64Encoded && enabled) {
      throw new Error(
        "Body is already base64 encoded, it can't be compressed. Use with non encoded body with compression.",
      );
    }
    this.compressBody = enabled;
    return this;
  }

  withContentType(contentType: MediaType): LambdaProxyResponseBuilder {
    this.contentType = contentType;
    return this;
  }

  withDebug(enabled: boolean = true): LambdaProxyResponseBuilder {
    this.debug = enabled;
    return this;
  }

  withLocation(location: string): LambdaProxyResponseBuilder {
    this.location = location;
    return this;
  }

  public static internalError(
    error: object | string = "Internal Error",
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create().withError(error, 500).build();
  }

  public static notImplemented(
    error: object | string = "Not Implemented",
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create().withError(error, 501).build();
  }

  public static badRequest(
    error: object | string = "Bad Request",
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create().withError(error, 400).build();
  }

  public static notFound(
    error: object | string = "Not Found",
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create().withError(error, 404).build();
  }

  public static unauthorized(
    error: object | string = "Unauthorized",
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create().withError(error, 401).build();
  }

  public static redirect(
    path: string,
    status: RedirectionStatusCode = 302,
  ): APIGatewayProxyResult {
    return LambdaProxyResponseBuilder.create()
      .withLocation(path)
      .withStatus(status)
      .build();
  }

  private withError<T extends object | string>(
    error: T,
    status: number,
  ): LambdaProxyResponseBuilder {
    return this.withStatus(status)
      .withBody(error)
      .withContentType(
        typeof error === "string"
          ? MediaType.TEXT_PLAIN
          : MediaType.APPLICATION_JSON,
      );
  }

  build(): APIGatewayProxyResult {
    const bodyNotRequired = [204, ...REDIRECTION_HTTP_STATUS_CODES].includes(
      this.status,
    );

    if (!this.body && !bodyNotRequired) {
      throw new Error("Body is required for LambdaResponseBuilder");
    }
    // This needs to be called before building the response as this might modify compressBody value
    const maybeEncodedBody = this.body ? this.encodeBody() : "";

    const response = {
      statusCode: this.status,
      headers: {
        "Content-Type": this.contentType,
        ...(this.compressBody ? { "Content-Encoding": "gzip" } : {}),
        ...(this.fileName
          ? { "Content-Disposition": `attachment; filename="${this.fileName}"` }
          : {}),
        ...(this.location ? { Location: this.location } : {}),
        ...(this.timestamp
          ? { "Last-Modified": this.timestamp.toUTCString() }
          : {}),
        ...(this.etag ? { ETag: this.etag } : {}),
      },
      body: maybeEncodedBody,
      isBase64Encoded: this.isBase64Encoded || this.compressBody,
    } satisfies APIGatewayProxyResult;

    // Count response size and return bad request if too large
    const sw = StopWatch.createStarted("countResponseSize");
    const responseJsonString = JSON.stringify(response);
    const responseSize = Buffer.byteLength(responseJsonString);
    sw.stop("countResponseSize");

    if (this.debug) {
      // Determine log level
      const logLevel =
        responseSize > MAX_LAMBDA_PAYLOAD_BYTES ? "error" : "info";
      logger[logLevel]({
        method: "LambdaResponseBuilder.build",
        message: "Built LambdaProxyResponse",
        customResponse: truncateMiddle(responseJsonString, 1000),
        customResponseSizeBytes: responseSize,
        customTooLarge: responseSize > MAX_LAMBDA_PAYLOAD_BYTES,
      });
    }
    // Lambda proxy integration max response size is 6 MiB
    if (responseSize > MAX_LAMBDA_PAYLOAD_BYTES) {
      return LambdaProxyResponseBuilder.badRequest(
        "Response too large. Limit response size with parameters.",
      );
    }

    return response;
  }

  /**
   * Encodes body to base64 string that is compressed if compression was requested only if
   * compressed value is smaller than uncompressed.
   *
   * @private
   * @return Base64 encoded body string and compressed if compression was requested,
   *         and it's smaller than uncompressed value.
   */
  private encodeBody(): string {
    if (!this.body) {
      throw new Error("Body is required for LambdaResponseBuilder");
    }

    if (this.isBase64Encoded || !this.compressBody) {
      // Body is already base64 encoded, or we don't want to compress it -> return as is
      return this.body;
    }

    const rawBuffer = Buffer.from(this.body, "utf8");
    const sw = StopWatch.createStarted("base64");
    const uncompressedBase64 = rawBuffer.toString("base64");

    sw.stop("base64").start("compress");
    const compressed = compressBuffer(rawBuffer);
    const compressedBase64 = compressed.toString("base64");

    sw.stop("compress");
    this.sizeUncompressedBase64Bytes = Buffer.byteLength(uncompressedBase64);
    this.sizeCompressedBase64Bytes = Buffer.byteLength(compressedBase64);

    const compressionNeeded =
      this.sizeCompressedBase64Bytes < this.sizeUncompressedBase64Bytes;

    if (this.debug) {
      const compressionRatio = (
        this.sizeUncompressedBase64Bytes / this.sizeCompressedBase64Bytes
      ).toFixed(1);
      const spaceSavingRatio = (
        1.0 -
        this.sizeCompressedBase64Bytes / this.sizeUncompressedBase64Bytes
      ).toFixed(1);

      logger.info({
        method: "LambdaResponseBuilder.build",
        message: "Compression ratio for LambdaResponse",
        customCompressedBytes: this.sizeCompressedBase64Bytes,
        customUncompressedBytes: this.sizeUncompressedBase64Bytes,
        customCompressionRatio: compressionRatio,
        customSpaceSavingRatio: spaceSavingRatio,
        customCompressionEnabled: compressionNeeded,
        customCompressionTookMs: sw.getDuration("compress"),
        customBase64TookMs: sw.getDuration("base64"),
      });
    }
    if (!compressionNeeded) {
      // deactivate compression and return uncompressed encoded body
      this.withCompression(false);
      return this.body;
    }

    // Compression was better than uncompressed
    return compressedBase64;
  }
}

/**
 * Subset of APIGatewayProxyEvent containing only query string parameters.
 * Useful to be used as simple proxy lambda handler parameter when not full event:
 * <code>import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";</code>
 * is not needed.
 *
 * Use <code>import type { APIGatewayProxyResult } from "aws-lambda";</code>
 * as return type for proxy lambda handlers.
 */
export type APIGatewayProxyEventSubset = Pick<
  APIGatewayProxyEvent,
  "queryStringParameters" | "multiValueQueryStringParameters"
>;
