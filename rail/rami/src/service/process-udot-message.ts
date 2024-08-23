import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { findTimeTableRows, type TimeTableRow } from "../dao/time_table_row.js";
import type { Connection } from "mysql2/promise";
import { inDatabase } from "../util/database.js";
import type { UnknownDelayOrTrackMessage, UnknownDelayOrTrack } from "../model/dt-rosm-message.js";
import { insertOrUpdate } from "../dao/udot.js";

export async function processUdotMessage(message: UnknownDelayOrTrackMessage): Promise<void> {
    const start = Date.now();
    let foundCount = 0;
    let notFoundCount = 0;

    try {
        const rows = await findTimeTableRows(message.trainNumber, message.departureDate);

        if(rows.length === 0) {
            logger.info({
                method: "ProcessSmMessageService.processUdotMessage",
                message: `Could not find rows for ${message.trainNumber} ${message.departureDate}`
            });

            return Promise.resolve();
        }

//        logger.debug(`rows for ${message.trainNumber} ${message.departureDate} : ${JSON.stringify(rows)}`);

        for(const datarow of message.data) {
            // find attap_id for each line
            const attapId = findAttapId(rows, datarow);

            if(attapId) {
                foundCount++;

                // each update in own connection, to prevent locking!
                await inDatabase(async (conn: Connection): Promise<void> => {
                    return await insertOrUpdate(conn, {
                        trainNumber: message.trainNumber,
                        trainDepartureDate: message.departureDate,
                        attapId, 
                        ut: datarow.unknownTrack,
                        ud: datarow.unknownDelay,
                        messageId: message.messageId
                    });
                });
        
            } else {
                notFoundCount++;

                logRowNotFound(message, datarow, rows);
            }
        };
    } finally {
        logger.info({
            method: "ProcessUdotMessageService.processUdotMessage",
            message: `udot for ${message.trainNumber} ${message.departureDate} processed`,
            tookMs: Date.now() - start,
            customFoundCount: foundCount,
            customNotFoundCount: notFoundCount
        });
    }
}

function logRowNotFound(message: UnknownDelayOrTrackMessage, datarow: UnknownDelayOrTrack, rows: TimeTableRow[]): void {
    logger.info({
        method: "ProcessUdotMessageService.processUdotMessage",
        message: `Could not find attapId for ${message.trainNumber} row ${JSON.stringify(datarow)}`
    });

    const row = rows.find(r => r.station_short_code === datarow.stationShortCode && r.type === datarow.type);

    if(row) {
        logger.info({
            method: "ProcessUdotMessageService.processUdotMessage",
            message: `Candidate ${JSON.stringify(row)}`
        });
        }
}

function findAttapId(rows: TimeTableRow[], datarow: UnknownDelayOrTrack): number | undefined {
    const row = rows.find(
        r => r.station_short_code === datarow.stationShortCode 
        && timesMatch(JSON.stringify(r.scheduled_time), JSON.stringify(datarow.scheduledTime)) 
        && r.type === datarow.type
    );

    return row?.attap_id;
}

// match at the minute level
function timesMatch(jsonTime1: string, jsonTime2: string): boolean {
    return jsonTime1.substring(0, 17) === jsonTime2.substring(0, 17);
}
