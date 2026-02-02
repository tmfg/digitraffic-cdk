import type { ForPersistingMetrics } from "../../ports/driven/for-persisting-metrics.js";
import type { ForRetrievingMetrics } from "../../ports/driven/for-retrieving-metrics.js";
import type { ForCollectingMetrics } from "../../ports/driving/for-collecting-metrics.js";
import { CollectionError } from "../errors/collection-error.js";
import type { CollectedMetric } from "../types/collected-metric.js";
import { createCollectedMetric } from "../types/collected-metric.js";
import type { CollectionResult } from "../types/collection-result.js";
import { createCollectionResult } from "../types/collection-result.js";
import type { MetricDefinition } from "../types/metric-definition.js";
import type { MetricScope } from "../types/metric-scope.js";
import type { TimePeriod } from "../types/time-period.js";

/**
 * MetricCollectionService implements the ForCollectingMetrics driving port.
 * It orchestrates metric collection from the data source and persistence to storage.
 */
export class MetricCollectionService implements ForCollectingMetrics {
  constructor(
    private readonly metricSource: ForRetrievingMetrics,
    private readonly metricStore: ForPersistingMetrics,
    private readonly metricDefinitions: MetricDefinition[],
  ) {}

  async collectAndPersist(
    scopes: MetricScope[],
    period: TimePeriod,
  ): Promise<CollectionResult> {
    const collectedMetrics: CollectedMetric[] = [];
    const errors: CollectionError[] = [];

    // Ensure database schema exists
    await this.metricStore.ensureSchema();

    // Collect metrics for each scope and definition combination
    for (const scope of scopes) {
      for (const definition of this.metricDefinitions) {
        try {
          const metric = await this.collectMetric(scope, definition, period);
          collectedMetrics.push(metric);
        } catch (error) {
          const collectionError =
            error instanceof CollectionError
              ? error
              : new CollectionError(
                  `Failed to collect metric ${definition.name} for scope ${scope.storageTag}`,
                  {
                    cause:
                      error instanceof Error ? error : new Error(String(error)),
                    scope,
                    definition,
                  },
                );
          errors.push(collectionError);
        }
      }
    }

    // Persist collected metrics
    if (collectedMetrics.length > 0) {
      try {
        await this.metricStore.persist(collectedMetrics);
      } catch (error) {
        const persistError = new CollectionError("Failed to persist metrics", {
          cause: error instanceof Error ? error : new Error(String(error)),
          inputValues: { metricCount: collectedMetrics.length },
        });
        errors.push(persistError);
      }
    }

    return createCollectionResult(collectedMetrics, errors);
  }

  private async collectMetric(
    scope: MetricScope,
    definition: MetricDefinition,
    period: TimePeriod,
  ): Promise<CollectedMetric> {
    const value = await this.metricSource.retrieveMetric(
      scope,
      definition,
      period,
    );
    return createCollectedMetric(definition, scope, value, period);
  }
}
