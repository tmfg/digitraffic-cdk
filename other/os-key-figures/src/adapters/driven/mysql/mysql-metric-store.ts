import mysql from "mysql";
import { MetricStoreError } from "../../../domain/errors/collection-error.js";
import type { CollectedMetric } from "../../../domain/types/collected-metric.js";
import type { ForPersistingMetrics } from "../../../ports/driven/for-persisting-metrics.js";

const KEY_FIGURES_TABLE_NAME = "key_figures";
const DUPLICATES_TABLE_NAME = "duplicates";

/**
 * Configuration for the MySQL metric store.
 */
export interface MySqlMetricStoreConfig {
  readonly host: string;
  readonly user: string;
  readonly password: string;
  readonly database: string;
}

/**
 * MySqlMetricStore implements ForPersistingMetrics using MySQL as the storage backend.
 */
export class MySqlMetricStore implements ForPersistingMetrics {
  private readonly connection: mysql.Connection;

  constructor(config: MySqlMetricStoreConfig) {
    this.connection = mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
    });
  }

  async persist(metrics: CollectedMetric[]): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    const firstMetric = metrics[0]!;
    const startDate = firstMetric.period.from;
    const existingRows = await this.existsForPeriod(
      firstMetric.scope.storageTag,
      firstMetric.definition.name,
      startDate,
    );

    const tableName = existingRows
      ? DUPLICATES_TABLE_NAME
      : KEY_FIGURES_TABLE_NAME;

    if (existingRows) {
      // Drop and recreate duplicates table for duplicate data
      await this.execute("DROP TABLE IF EXISTS ??", [DUPLICATES_TABLE_NAME]);
      await this.createTable(DUPLICATES_TABLE_NAME);
    }

    for (const metric of metrics) {
      await this.insertMetric(metric, tableName);
    }
  }

  async existsForPeriod(
    storageTag: string,
    name: string,
    from: Date,
  ): Promise<boolean> {
    const fromDateStr = from.toISOString().substring(0, 10);
    const rows = await this.query<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM ?? WHERE `from` = ? AND `name` = ? AND `filter` = ?",
      [KEY_FIGURES_TABLE_NAME, fromDateStr, name, storageTag],
    );
    return (rows[0]?.count ?? 0) > 0;
  }

  async ensureSchema(): Promise<void> {
    const tables = await this.query<Record<string, unknown>[]>("SHOW TABLES");
    if (tables.length === 0) {
      await this.createTable(KEY_FIGURES_TABLE_NAME);
      await this.createIndex(KEY_FIGURES_TABLE_NAME);
    }
  }

  private async insertMetric(
    metric: CollectedMetric,
    tableName: string,
  ): Promise<void> {
    const fromDateStr = metric.period.from.toISOString().substring(0, 10);
    const toDateStr = metric.period.to.toISOString().substring(0, 10);
    const valueJson = JSON.stringify(metric.value);
    // Use sourceQuery if available, otherwise empty string for backward compatibility
    const queryStr = metric.sourceQuery ?? "";

    await this.execute(
      "INSERT INTO ?? (`from`, `to`, `query`, `value`, `name`, `filter`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        tableName,
        fromDateStr,
        toDateStr,
        queryStr,
        valueJson,
        metric.definition.name,
        metric.scope.storageTag,
      ],
    );
  }

  private async createTable(tableName: string): Promise<void> {
    await this.execute(
      "CREATE TABLE ?? (`id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `from` DATE NOT NULL, `to` DATE NOT NULL, `name` VARCHAR(100) NOT NULL, `filter` VARCHAR(1000) NOT NULL, `query` VARCHAR(1000) NOT NULL, `value` JSON NOT NULL, PRIMARY KEY (`id`))",
      [tableName],
    );
  }

  private async createIndex(tableName: string): Promise<void> {
    await this.execute(
      "CREATE INDEX filter_name_date ON ?? (`filter`, `name`, `from`, `to`)",
      [tableName],
    );
  }

  private query<T>(sql: string, values?: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, values, (error, rows) => {
        if (error) {
          reject(
            new MetricStoreError(`Query failed: ${error.message}`, {
              cause: error,
              operation: "query",
              inputValues: { sql, values },
            }),
          );
        } else {
          resolve(rows as T);
        }
      });
    });
  }

  private execute(sql: string, values?: unknown[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, values, (error) => {
        if (error) {
          reject(
            new MetricStoreError(`Execute failed: ${error.message}`, {
              cause: error,
              operation: "execute",
              inputValues: { sql, values },
            }),
          );
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Close the database connection.
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.connection.end(() => resolve());
    });
  }
}
