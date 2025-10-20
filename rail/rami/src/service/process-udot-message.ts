import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { findTimeTableRows, type TimeTableRow } from "../dao/time_table_row.js";
import type { Connection } from "mysql2/promise";
import { inTransaction } from "../util/database.js";
import type {
  UnknownDelayOrTrack,
  UnknownDelayOrTrackMessage,
} from "../model/dt-rosm-message.js";
import { insertOrUpdate } from "../dao/udot.js";
import { getTraceFields, runWithChildSpan } from "../util/tracing.js";

export async function processUdotMessage(
  message: UnknownDelayOrTrackMessage,
): Promise<void> {
  return runWithChildSpan(async () => {
    const start = Date.now();
    let foundCount = 0;
    let notFoundCount = 0;

    try {
      const rows = await findTimeTableRows(
        message.trainNumber,
        message.departureDate,
      );

      if (rows.length === 0) {
        logger.info({
          ...getTraceFields(),
          method: "ProcessUdotMessageService.processUdotMessage",
          message:
            `Could not find rows for ${message.trainNumber} ${message.departureDate}`,
          customTrainNumber: message.trainNumber,
          customTrainDepartureDate: message.departureDate,
        });

        return Promise.resolve();
      }

      await inTransaction(async (conn: Connection): Promise<void> => {
        for (const datarow of message.data) {
          const attapId = findAttapId(rows, datarow);

          if (attapId) {
            foundCount++;

            await insertOrUpdate(conn, {
              trainNumber: message.trainNumber,
              trainDepartureDate: message.departureDate,
              attapId,
              messageId: message.messageId,
              ut: datarow.unknownTrack,
              ud: datarow.unknownDelay,
            });
          } else {
            notFoundCount++;
          }
        }
      });
    } finally {
      logger.info({
        ...getTraceFields(),
        method: "ProcessUdotMessageService.processUdotMessage",
        message:
          `udot for ${message.trainNumber} ${message.departureDate} processed`,
        customTrainNumber: message.trainNumber,
        customTrainDepartureDate: message.departureDate,
        tookMs: Date.now() - start,
        customFoundCount: foundCount,
        customNotFoundCount: notFoundCount,
      });
    }
  });
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function logRowNotFound(
  message: UnknownDelayOrTrackMessage,
  datarow: UnknownDelayOrTrack,
  rows: TimeTableRow[],
): void {
  logger.info({
    method: "ProcessUdotMessageService.processUdotMessage",
    message: `Could not find attapId for ${message.trainNumber} row ${
      JSON.stringify(datarow)
    }`,
  });

  const row = rows.find((r) =>
    r.station_short_code === datarow.stationShortCode && r.type === datarow.type
  );

  if (row) {
    logger.info({
      method: "ProcessUdotMessageService.processUdotMessage",
      message: `Candidate ${JSON.stringify(row)}`,
    });
  }
}

function findAttapId(
  rows: TimeTableRow[],
  datarow: UnknownDelayOrTrack,
): number | undefined {
  const row = rows.find(
    (r) =>
      r.station_short_code === datarow.stationShortCode &&
      timesMatch(
        JSON.stringify(r.scheduled_time),
        JSON.stringify(datarow.scheduledTime),
      ) &&
      r.type === datarow.type,
  );

  return row?.attap_id;
}

// match at the minute level
function timesMatch(jsonTime1: string, jsonTime2: string): boolean {
  return jsonTime1.substring(0, 17) === jsonTime2.substring(0, 17);
}
