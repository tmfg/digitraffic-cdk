import type { MetricDefinition } from "../../domain/types/metric-definition.js";
import type { MetricScope } from "../../domain/types/metric-scope.js";
import type { MetricValue } from "../../domain/types/metric-value.js";
import type { TimePeriod } from "../../domain/types/time-period.js";

/**
 * ForRetrievingMetrics is a driven port (secondary port) that defines
 * what the application needs for retrieving metric values from a data source.
 *
 * The adapter implementing this port (e.g., OpenSearchMetricSource) will
 * translate domain concepts into data source specific queries.
 */
export interface ForRetrievingMetrics {
  /**
   * Retrieve a metric value for the given scope, definition, and time period.
   *
   * @param scope - What we're collecting metrics for (service + optional endpoint)
   * @param definition - What metric to collect (name, value type, index)
   * @param period - The time period to collect metrics for
   * @returns The metric value (scalar or distribution)
   */
  retrieveMetric(
    scope: MetricScope,
    definition: MetricDefinition,
    period: TimePeriod,
  ): Promise<MetricValue>;
}
