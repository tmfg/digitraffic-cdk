import type { MetricDefinition } from "./metric-definition.js";
import type { MetricScope } from "./metric-scope.js";
import type { MetricValue } from "./metric-value.js";
import type { TimePeriod } from "./time-period.js";

/**
 * CollectedMetric represents a metric that has been collected.
 */
export interface CollectedMetric {
  readonly definition: MetricDefinition;
  readonly scope: MetricScope;
  readonly value: MetricValue;
  readonly period: TimePeriod;
  /**
   * Optional: The source query used to collect this metric.
   * This is adapter-specific metadata used for debugging/auditing.
   * For OpenSearch, this would be the ES query JSON.
   */
  readonly sourceQuery?: string;
}

export function createCollectedMetric(
  definition: MetricDefinition,
  scope: MetricScope,
  value: MetricValue,
  period: TimePeriod,
  sourceQuery?: string,
): CollectedMetric {
  return { definition, scope, value, period, sourceQuery };
}
