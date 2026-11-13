import { snakeCase } from "es-toolkit";
import type { LoggerMethodType } from "./dt-logger.js";
import { logger } from "./dt-logger-default.js";
import { WIDE_CONTEXT } from "./wide-context.js";

const METHOD: LoggerMethodType = "HttpLogger.logStatus" as const;

/**
 * Creates request loggers that share integration-level context.
 *
 * Create one factory for the HTTP integration and use {@link logger} for
 * each outbound request. The optional URL template keeps variable path
 * values out of aggregations while the full URL remains available in logs.
 */
export class LoggerFactory {
  private readonly _context: string;
  private readonly _traceId?: string;
  private readonly _urlTemplate?: string;

  constructor(parameters: {
    context: string;
    traceId?: string;
    urlTemplate?: string;
  }) {
    this._context = parameters.context;
    this._traceId = parameters.traceId;
    this._urlTemplate = parameters.urlTemplate;
  }

  /** Creates a timer and logger for one outbound HTTP request. */
  logger(url: string, urlTemplate?: string): HttpLogger {
    return new HttpLogger({
      context: this._context,
      url,
      traceId: this._traceId,
      urlTemplate: urlTemplate ?? this._urlTemplate,
    });
  }
}

/**
 * Logs the outcome and duration of HTTP requests. Usually one, but in case of retries there may be multiple logs for the same logical request.
 *
 * Given context will be reduced to snake_case.
 * Given URL templates will have their scheme and host stripped.
 *
 * Call {@link end} when a response status is available. Call {@link error}
 * when the request fails before a response is received. Each terminal method
 * writes one info-level log entry containing the request context, URL, status
 * or error type, and duration in seconds.
 */
export class HttpLogger {
  private readonly _context: string;
  private readonly _url: string;
  private readonly _urlTemplate?: string;
  private readonly _traceId?: string;

  private _startTime: number;

  constructor(parameters: {
    context: string;
    url: string;
    traceId?: string;
    urlTemplate?: string;
  }) {
    this._context = snakeCase(parameters.context);
    this._url = parameters.url;
    this._traceId = parameters.traceId;
    this._urlTemplate = parameters.urlTemplate?.replace(
      /^https?:\/\/[^/?#]+/i,
      "",
    );

    this._startTime = Date.now();
  }

  start(): void {
    this._startTime = Date.now();
  }

  /** Records a received HTTP response and writes the request log entry. */
  logResponse(statusCode: number, contentLength?: number): void {
    const endTime = Date.now();

    this.logStatus({ endTime, statusCode, contentLength });
  }

  /**
   * Records a failed request and writes the request log entry.
   *
   * Errors are represented by their name, strings are kept as-is, and
   * other values are recorded as `Unknown`. Since no response was received,
   * the status code is left undefined.
   */
  logError(error: unknown): void {
    let errorType: string;

    if (typeof error === "string") {
      errorType = error;
    } else if (error instanceof Error) {
      errorType = error.name;
    } else {
      errorType = "Unknown";
    }

    const endTime = Date.now();

    this.logStatus({
      endTime,
      errorType,
    });
  }

  private logStatus(parameters: {
    endTime: number;
    statusCode?: number;
    contentLength?: number;
    errorType?: string;
  }): void {
    logger.info({
      method: METHOD,
      [WIDE_CONTEXT.TRACE_ID]: this._traceId,
      [WIDE_CONTEXT.LOGGING.CONTEXT]: this._context,
      [WIDE_CONTEXT.HTTP_KEYS.URL]: this._url,
      [WIDE_CONTEXT.HTTP_KEYS.URL_TEMPLATE]: this._urlTemplate,
      [WIDE_CONTEXT.HTTP_KEYS.ERROR_TYPE]: parameters.errorType,
      [WIDE_CONTEXT.HTTP_KEYS.STATUS_CODE]: parameters.statusCode,
      [WIDE_CONTEXT.HTTP_KEYS.DURATION]:
        (parameters.endTime - this._startTime) / 1000,
      [WIDE_CONTEXT.HTTP_KEYS.CONTENT_LENGTH]: parameters.contentLength,
    });
  }
}
