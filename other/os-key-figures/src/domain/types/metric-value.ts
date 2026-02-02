/**
 * MetricValueType indicates what kind of data a metric returns.
 */
export enum MetricValueType {
  /**
   * A single numeric value (e.g., count, sum, average).
   * Examples: total request count, sum of bytes, unique IP count.
   */
  SCALAR = "scalar",

  /**
   * A mapping of categorical keys to numeric counts.
   * Examples: HTTP status codes → counts, top IPs → request counts, referrers → counts.
   * Stored as Record<string, number>.
   */
  CATEGORICAL_COUNTS = "categorical_counts",
}

/**
 * MetricValue is the result of collecting a metric.
 */
export type MetricValue = number | Record<string, number>;

export function isScalarValue(value: MetricValue): value is number {
  return typeof value === "number";
}

export function isCategoricalCountsValue(
  value: MetricValue,
): value is Record<string, number> {
  return typeof value === "object" && value !== null;
}
