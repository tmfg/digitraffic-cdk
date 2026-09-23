import etag from "etag";
import { encodeUtf8ToBase64 } from "../../utils/base64.js";
import { truncateMiddle } from "../../utils/logging.js";
import { StopWatch } from "../../utils/stop-watch.js";
import { logger } from "../runtime/dt-logger-default.js";
import { MAX_LAMBDA_PAYLOAD_BYTES } from "./lambda-proxy-types.js";

export class LambdaResponse {
  readonly status: number;
  readonly body: string;
  readonly fileName?: string;
  readonly timestamp?: string;
  readonly etag: string;

  constructor(
    status: number,
    body: string,
    fileName?: string,
    timestamp?: Date,
    etagValue: string = etag(body),
  ) {
    this.status = status;
    this.body = body;
    this.fileName = fileName;
    this.timestamp = timestamp?.toUTCString();
    this.etag = etagValue; // create strong etag by default
  }

  /**
   * @Deprecated Use LambdaResponseBuilder.create().withTimestamp(...).build() instead.
   */
  withTimestamp(timestamp: Date): LambdaResponse {
    return new LambdaResponse(
      this.status,
      this.body,
      this.fileName,
      timestamp,
      this.etag,
    );
  }

  /**
   * Create LambdaResponse for HTTP 200 from json.
   * @Deprecated Use LambdaResponseBuilder.create().withBody(...).build() instead.
   */
  static okJson<T>(json: T, fileName?: string): LambdaResponse {
    return LambdaResponse.ok(JSON.stringify(json), fileName);
  }

  /**
   * Create LambdaResponse for HTTP 200 from string.
   * @Deprecated Use LambdaResponseBuilder.create().withBody(...).build() instead.
   */
  static ok(body: string, fileName?: string): LambdaResponse {
    return LambdaResponse.okBinary(toBase64(body), fileName);
  }

  /**
   * Create LambdaResponse for HTTP 200 from base64-encoded data.
   * @Deprecated Use LambdaResponseBuilder.create().withBody(...).build() instead.
   */
  static okBinary(base64: string, fileName?: string): LambdaResponse {
    return LambdaResponse.createForBase64(200, base64, fileName);
  }

  /**
   * Create LambdaResponse for HTTP 400
   * @Deprecated Use LambdaResponseBuilder.badRequest instead.
   */
  static badRequest(error: string = "Bad Request"): LambdaResponse {
    return LambdaResponse.createForString(400, error);
  }

  /**
   * Create LambdaResponse for HTTP 404
   * @Deprecated Use LambdaResponseBuilder.notFound instead.
   */
  static notFound(error: string = "Not Found"): LambdaResponse {
    return LambdaResponse.createForString(404, error);
  }

  /**
   * Create LambdaResponse for HTTP 500
   * @Deprecated Use LambdaResponseBuilder.internalError instead.
   */
  static internalError(error: string = "Internal Error"): LambdaResponse {
    return LambdaResponse.createForString(500, error);
  }

  /**
   * Create LambdaResponse for HTTP 401
   * @Deprecated Use LambdaResponseBuilder.unauthorized instead.
   */
  static unauthorized(error: string = "Unauthorized"): LambdaResponse {
    return LambdaResponse.createForString(401, error);
  }

  /**
   * Create LambdaResponse for HTTP 413
   * @Deprecated Use LambdaResponseBuilder.badRequest instead.
   */
  static contentTooLarge(error: string = "Content Too Large"): LambdaResponse {
    return LambdaResponse.createForString(413, error);
  }

  /**
   * Create LambdaResponse for HTTP 501
   * @Deprecated Use LambdaResponseBuilder.notImplemented instead.
   */
  static notImplemented(error: string = "Not Implemented"): LambdaResponse {
    return LambdaResponse.createForString(501, error);
  }

  private static createForString(
    status: number,
    body: string,
    fileName?: string,
  ): LambdaResponse {
    return LambdaResponse.createForBase64(status, toBase64(body), fileName);
  }

  private static createForBase64(
    status: number,
    base64Body: string,
    fileName?: string,
  ): LambdaResponse {
    return new LambdaResponse(status, base64Body, fileName);
  }
}

function toBase64(body: string): string {
  return Buffer.from(body).toString("base64");
}

/**
 * Default status is 200 and compressed = false.
 */
export class LambdaResponseBuilder {
  body?: string;
  etag?: string;
  fileName?: string;
  timestamp?: Date;
  status: number = 200;
  debug: boolean = false;

  static create(body?: object | string): LambdaResponseBuilder {
    const builder = new LambdaResponseBuilder();
    if (body !== undefined) {
      builder.withBody(body);
    }

    return builder;
  }

  withBody<T extends object | string>(body: T) {
    this.body = typeof body === "string" ? body : JSON.stringify(body);
    // create strong etag by default from original body
    this.etag = etag(this.body); // create strong etag by default from original body
    return this;
  }

  withFileName(fileName: string): LambdaResponseBuilder {
    this.fileName = fileName;
    return this;
  }

  withStatus(status: number): LambdaResponseBuilder {
    this.status = status;
    return this;
  }

  withTimestamp(timestamp: Date | string | undefined): LambdaResponseBuilder {
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

  withDebug(enabled: boolean = true): LambdaResponseBuilder {
    this.debug = enabled;
    return this;
  }

  public static internalError(
    error: string = "Internal Error",
  ): LambdaResponse {
    return LambdaResponseBuilder.create().withError(error, 500).build();
  }

  public static notImplemented(
    error: string = "Not Implemented",
  ): LambdaResponse {
    return LambdaResponseBuilder.create().withError(error, 501).build();
  }

  public static badRequest(error: string = "Bad Request"): LambdaResponse {
    return LambdaResponseBuilder.create().withError(error, 400).build();
  }

  public static notFound(error: string = "Not Found"): LambdaResponse {
    return LambdaResponseBuilder.create().withError(error, 404).build();
  }

  public static unauthorized(error: string = "Unauthorized"): LambdaResponse {
    return LambdaResponseBuilder.create().withError(error, 401).build();
  }

  private withError<T extends object | string>(
    error: T,
    status: number,
  ): LambdaResponseBuilder {
    return this.withStatus(status).withBody(error);
  }

  build(): LambdaResponse {
    if (!this.body) {
      throw new Error("Body is required for LambdaResponseBuilder");
    }
    const encodedBody = this.encodeBody();

    const response = new LambdaResponse(
      this.status,
      encodedBody,
      this.fileName,
      this.timestamp,
      this.etag,
    );

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
      return LambdaResponseBuilder.badRequest(
        "Response too large. Limit response size with parameters.",
      );
    }

    return response;
  }

  /**
   * Encodes body to base64 string.
   * @private
   * @return Body as base64 encoded string.
   */
  private encodeBody(): string {
    if (!this.body) {
      throw new Error("Body is required for LambdaResponseBuilder");
    }
    return encodeUtf8ToBase64(this.body);
  }
}
