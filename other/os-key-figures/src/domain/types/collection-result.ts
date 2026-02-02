import type { CollectionError } from "../errors/collection-error.js";
import type { CollectedMetric } from "./collected-metric.js";

/**
 * CollectionResult represents the outcome of collecting metrics.
 */
export interface CollectionResult {
  readonly metrics: CollectedMetric[];
  readonly errors: CollectionError[];
}

export function createCollectionResult(
  metrics: CollectedMetric[],
  errors: CollectionError[] = [],
): CollectionResult {
  return { metrics, errors };
}

export function isSuccess(result: CollectionResult): boolean {
  return result.errors.length === 0;
}

export function hasPartialSuccess(result: CollectionResult): boolean {
  return result.metrics.length > 0 && result.errors.length > 0;
}
