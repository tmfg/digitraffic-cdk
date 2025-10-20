import type { Connection, QueryResult, ResultSetHeader } from "mysql2/promise";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { TraceContext } from "../util/tracing.js";
import { createChildSpan, getTraceFields } from "../util/tracing.js";

const SQL_DELETE_OLD_UDOT_VALUES = `
DELETE FROM rami_udot
WHERE created_db < current_timestamp() - INTERVAL 1 DAY`;

const SQL_DELETE_OLD_UDOT_HISTORY_VALUES = `
DELETE FROM rami_udot_history
WHERE created_db < current_timestamp() - INTERVAL 1 DAY`;

const SQL_UPDATE_FALSE_VALUES = `
UPDATE rami_udot
SET unknown_delay = false, unknown_track = false
WHERE train_number = :trainNumber AND train_departure_date = :trainDepartureDate 
AND attap_id = :attapId
AND NOT (unknown_delay = false AND unknown_track = false)`;

const SQL_UPSERT_UDOT_VALUES = `
INSERT INTO rami_udot(train_number, train_departure_date, attap_id, unknown_delay, unknown_track)
VALUES (:trainNumber, :trainDepartureDate, :attapId, :ud, :ut)
ON DUPLICATE KEY UPDATE -- unique (train_departure_date, train_number, attap_id)
    unknown_delay = VALUES(unknown_delay),
    unknown_track = VALUES(unknown_track)`;

const SQL_MERGE_HISTORY = `
insert into rami_udot_history(rami_message_id, train_number, train_departure_date, attap_id, unknown_track, unknown_delay)
select :messageId, train_number, train_departure_date, attap_id, :ut, :ud
from rami_udot
where train_number = :trainNumber 
and train_departure_date = :trainDepartureDate
and attap_id = :attapId
and model_updated_time is null
`;

export interface UdotUpsertValues {
  readonly trainNumber: number;
  readonly trainDepartureDate: string;
  readonly attapId: number;
  readonly messageId: string;

  readonly ut: boolean;
  readonly ud: boolean;
}

export async function insertOrUpdate(
  conn: Connection,
  values: UdotUpsertValues,
  traceContext?: TraceContext,
): Promise<void> {
  const method = "UdotDao.insertOrUpdate" as const;
  const spanContext = traceContext ? createChildSpan(traceContext) : undefined;
  const start = Date.now();

  try {
    // if both values are false, there is no point inserting it, you can just update existing values if any
    const updateSql = values.ud === false && values.ut === false
      ? SQL_UPDATE_FALSE_VALUES
      : SQL_UPSERT_UDOT_VALUES;
    const result = await executeWithRetry<ResultSetHeader>(
      conn,
      updateSql,
      values,
      3,
      spanContext,
    );

    if (result.affectedRows > 0) {
      logger.info({
        ...(spanContext ? getTraceFields(spanContext) : {}),
        method: "UdotDao.insertOrUpdate",
        customEvent: "query_completed",
        customAffectedRows: result.affectedRows,
        customTrainNumber: values.trainNumber,
        customTrainDepartureDate: values.trainDepartureDate,
        customAttapId: values.attapId,
        tookMs: Date.now() - start,
      });

      // insert history only if something was updated
      await conn.execute(SQL_MERGE_HISTORY, values);
    }
  } catch (error) {
    logger.error({
      ...(spanContext ? getTraceFields(spanContext) : {}),
      method,
      customEvent: "query_failed",
      customDoUpdate: (values.ud === false && values.ut === false),
      customSql: SQL_UPSERT_UDOT_VALUES,
      customTrainNumber: values.trainNumber,
      customTrainDepartureDate: values.trainDepartureDate,
      customAttapId: values.attapId,
      customIsDeadlock: String(error).includes("Deadlock"),
      tookMs: Date.now() - start,
      error,
    });
    throw error;
  }
}

async function executeWithRetry<T extends QueryResult>(
  conn: Connection,
  sql: string,
  values: UdotUpsertValues,
  retries: number = 3,
  traceContext?: TraceContext,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return (await conn.execute<T>(sql, values))[0];
    } catch (err: unknown) {
      lastError = err;
      logger.warn({
        ...(traceContext ? getTraceFields(traceContext) : {}),
        method: "UdotDao.executeWithRetry",
        message: `Query failed on attempt ${i + 1} of ${retries}.`,
        customWillRetry: i < retries - 1,
        customIsDeadlock: String(err).includes("Deadlock"),
        customTrainNumber: values.trainNumber,
        customTrainDepartureDate: values.trainDepartureDate,
        customAttapId: values.attapId,
        error: err,
      });
      if (i < retries - 1) {
        // Wait only if we will retry again
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

export async function deleteOldValues(conn: Connection): Promise<void> {
  await conn.execute(SQL_DELETE_OLD_UDOT_VALUES);
  await conn.execute(SQL_DELETE_OLD_UDOT_HISTORY_VALUES);
}
