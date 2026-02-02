import type { MetricValueType } from "./metric-value.js";

/**
 * MetricDefinition defines what metric to collect.
 * The domain knows metric names and value types, but not how they're queried.
 * Infrastructure details (like which database index to use) are NOT part of this.
 */
export interface MetricDefinition {
  /** The name of the metric (e.g., "Http req", "Bytes out") */
  readonly name: string;

  /**
   * Whether this metric returns a scalar or categorical counts.
   * - SCALAR: A single numeric value (e.g., total request count, sum of bytes)
   * - CATEGORICAL_COUNTS: A mapping of category keys to counts (e.g., status code → count, IP → request count)
   */
  readonly valueType: MetricValueType;

  /** Optional description of what this metric measures */
  readonly description?: string;
}

/**
 * Creates a MetricDefinition with the given properties.
 */
export function createMetricDefinition(
  name: string,
  valueType: MetricValueType,
  description?: string,
): MetricDefinition {
  return { name, valueType, description };
}
