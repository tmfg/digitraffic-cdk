import type { MetricDefinition } from "../types/metric-definition.js";
import type { MetricScope } from "../types/metric-scope.js";

/**
 * CollectionError represents an error that occurred during metric collection.
 * Contains context for debugging including stack trace and input values.
 */
export class CollectionError extends Error {
  override readonly cause?: Error;
  readonly scope?: MetricScope;
  readonly definition?: MetricDefinition;
  readonly inputValues?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      scope?: MetricScope;
      definition?: MetricDefinition;
      inputValues?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "CollectionError";
    this.cause = options?.cause;
    this.scope = options?.scope;
    this.definition = options?.definition;
    this.inputValues = options?.inputValues;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CollectionError);
    }
  }
}

/**
 * MetricSourceError represents an error from the metric data source.
 */
export class MetricSourceError extends CollectionError {
  readonly statusCode?: number;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      scope?: MetricScope;
      definition?: MetricDefinition;
      inputValues?: Record<string, unknown>;
      statusCode?: number;
    },
  ) {
    super(message, options);
    this.name = "MetricSourceError";
    this.statusCode = options?.statusCode;
  }
}

/**
 * MetricStoreError represents an error from the metric persistence layer.
 */
export class MetricStoreError extends CollectionError {
  readonly operation?: string;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      scope?: MetricScope;
      definition?: MetricDefinition;
      inputValues?: Record<string, unknown>;
      operation?: string;
    },
  ) {
    super(message, options);
    this.name = "MetricStoreError";
    this.operation = options?.operation;
  }
}
