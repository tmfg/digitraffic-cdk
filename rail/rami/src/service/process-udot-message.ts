import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { findTimeTableRows, type TimeTableRow } from "../dao/time_table_row.js";
import { insertOrUpdate, type UpsertValues } from "../dao/stop_monitoring.js";
import type { Connection } from "mysql2/promise";
import { inTransaction } from "../util/database.js";
import type { UnknownDelayOrTrackMessage, UnknownDelayOrTrack } from "../model/dt-rosm-message.js";

export async function processUDOTMessage(message: UnknownDelayOrTrackMessage): Promise<void> {
    logger.info({
        method: "ProcessSmMessageService.processUDOTMessage",
        message: `Message for train ${message.trainNumber} ${message.departureDate}`
    });

    const rows = await findTimeTableRows(message.trainNumber, message.departureDate);

    if(rows.length === 0) {
        logger.info({
            method: "ProcessSmMessageService.processUDOTMessage",
            message: `Could not find rows for ${message.trainNumber} ${message.departureDate}`
        });

        return Promise.resolve();
    }

    logger.debug(`rows for ${message.trainNumber} ${message.departureDate} : ${JSON.stringify(rows)}`);

    let foundCount = 0;
    let notFoundCount = 0;
    const upsertValues: UpsertValues[] = [];

    message.data.forEach(datarow => {
        // find attap_id for each line
        const attapId = findAttapId(rows, datarow);

        if(attapId) {
            foundCount++;
            upsertValues.push({
                trainNumber: message.trainNumber,
                trainDepartureDate: message.departureDate,
                attapId, 
                ut: datarow.trackUnknown,
                ud: datarow.delayUnknown,
                messageId: message.messageId
            });
        } else {
            notFoundCount++;
            logger.info({
                method: "ProcessSmMessageService.processSmMessage",
                message: `Could not find attapId for ${message.trainNumber} row ${JSON.stringify(datarow)}`
            });
        }
    });

    logger.info({
        method: "ProcessSmMessageService.processSmMessage",
        message: `udot for ${message.trainNumber} ${message.departureDate} processed`,
        customFoundCount: foundCount,
        customNotFoundCount: notFoundCount
    });

    logger.debug(upsertValues);
    
    return inTransaction(async (conn: Connection): Promise<void> => {
        // run all updates to db
        await insertOrUpdate(conn, upsertValues);
    });
}

function findAttapId(rows: TimeTableRow[], datarow: UnknownDelayOrTrack): number | undefined {
    const row = rows.find(r => {
 //       if(r.station_short_code === datarow.stationShortCode) {
//            console.info(`Comparing ${JSON.stringify(r)} and ${JSON.stringify(datarow)} ${r.station_short_code === datarow.stationShortCode && r.type === datarow.type && JSON.stringify(r.scheduled_time) === JSON.stringify(datarow.scheduledTime)}`);

            return JSON.stringify(r.scheduled_time) === JSON.stringify(datarow.scheduledTime) && r.station_short_code === datarow.stationShortCode && r.type === datarow.type
 //       }

 //       return false;
    });

    return row?.attap_id;
}
