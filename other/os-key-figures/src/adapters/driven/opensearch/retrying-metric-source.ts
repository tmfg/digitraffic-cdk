import type { MetricDefinition } from "../../../domain/types/metric-definition.js";
import type { MetricScope } from "../../../domain/types/metric-scope.js";
import type { MetricValue } from "../../../domain/types/metric-value.js";
import type { TimePeriod } from "../../../domain/types/time-period.js";
import type { ForRetrievingMetrics } from "../../../ports/driven/for-retrieving-metrics.js";
import type { RetryPolicy } from "./retry-policy.js";
import { DEFAULT_RETRY_POLICY, executeWithRetry } from "./retry-policy.js";

/**
 * RetryingMetricSource is a decorator that adds retry logic to any ForRetrievingMetrics implementation.
 * Follows the decorator pattern for clean separation of concerns.
 */
export class RetryingMetricSource implements ForRetrievingMetrics {
  constructor(
    private readonly delegate: ForRetrievingMetrics,
    private readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
  ) {}

  async retrieveMetric(
    scope: MetricScope,
    definition: MetricDefinition,
    period: TimePeriod,
  ): Promise<MetricValue> {
    return executeWithRetry(
      () => this.delegate.retrieveMetric(scope, definition, period),
      this.retryPolicy,
    );
  }
}
