import type { LoggerMethodType } from "./dt-logger.js";
import { logger } from "./dt-logger-default.js";
import { WIDE_CONTEXT } from "./wide-context.js";

const METHOD_CLEANUP: LoggerMethodType =
  "MaintenanceLogger.logCleanup" as const;
const METHOD_ERROR: LoggerMethodType = "MaintenanceLogger.logError" as const;

export class MaintenanceLogger {
  public static instance(): MaintenanceLogger {
    return new MaintenanceLogger();
  }

  /**
   * Logs a successful database cleanup operation with structured metrics.
   *
   * @param tableName - The name of the table being cleaned up
   * @param deletedCount - Number of rows deleted
   * @param batchSize - Size of the batch processed
   * @param seconds - Duration of the operation in seconds
   */
  logCleanup(
    tableName: string,
    deletedCount: number,
    batchSize: number,
    seconds: number,
  ): void {
    logger.info({
      method: METHOD_CLEANUP,
      [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_SUCCESS,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: tableName,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_DELETED_COUNT]: deletedCount,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_BATCH_SIZE]: batchSize,
      [WIDE_CONTEXT.DURATION]: seconds,
    });
  }

  /**
   * Logs a database cleanup operation error with relevant context.
   *
   * @param tableName - The name of the table where the error occurred
   * @param seconds - Duration of the operation before the error in seconds
   * @param error - The error that occurred
   */
  logError(tableName: string, seconds: number, error: unknown): void {
    logger.error({
      method: METHOD_ERROR,
      [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_ERROR,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
      [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: tableName,
      [WIDE_CONTEXT.DURATION]: seconds,
      error,
    });
  }
}
