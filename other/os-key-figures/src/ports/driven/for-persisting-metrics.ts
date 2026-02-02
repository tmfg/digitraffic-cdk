import type { CollectedMetric } from "../../domain/types/collected-metric.js";

/**
 * ForPersistingMetrics is a driven port (secondary port) that defines
 * what the application needs for storing collected metrics.
 *
 * Named using Cockburn's "ForDoingSomething" convention.
 */
export interface ForPersistingMetrics {
  /**
   * Persist collected metrics to storage.
   *
   * @param metrics - The metrics to persist
   */
  persist(metrics: CollectedMetric[]): Promise<void>;

  /**
   * Check if metrics already exist for a given storage tag, metric name, and start date.
   * Used to avoid duplicate entries.
   *
   * @param storageTag - The storage identifier
   * @param name - The metric name
   * @param from - The start date of the period
   * @returns True if metrics exist, false otherwise
   */
  existsForPeriod(
    storageTag: string,
    name: string,
    from: Date,
  ): Promise<boolean>;

  /**
   * Ensure the database schema exists (create tables if needed).
   */
  ensureSchema(): Promise<void>;
}
