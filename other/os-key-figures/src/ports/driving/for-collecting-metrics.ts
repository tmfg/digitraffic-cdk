import type { CollectionResult } from "../../domain/types/collection-result.js";
import type { MetricScope } from "../../domain/types/metric-scope.js";
import type { TimePeriod } from "../../domain/types/time-period.js";

/**
 * ForCollectingMetrics is a driving port (primary port) that defines
 * what the application offers for metric collection.
 */
export interface ForCollectingMetrics {
  /**
   * Collect metrics for the given scopes and time period, then persist them.
   *
   * @param scopes - The scopes to collect metrics for (service + optional endpoint)
   * @param period - The time period to collect metrics for
   * @returns A result containing collected metrics and any errors
   */
  collectAndPersist(
    scopes: MetricScope[],
    period: TimePeriod,
  ): Promise<CollectionResult>;
}
