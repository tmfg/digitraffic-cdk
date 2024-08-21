import type { Connection } from "mysql2/promise";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const SQL_DELETE_OLD_UDOT_VALUES = `
DELETE FROM rami_udot
WHERE created_db < current_timestamp() - INTERVAL 1 DAY`;

const SQL_DELETE_OLD_UDOT_HISTORY_VALUES = `
DELETE FROM rami_udot_history
WHERE created_db < current_timestamp() - INTERVAL 1 DAY`;

const SQL_UPDATE_FALSE_VALUES = `
UPDATE rami_udot
SET unknown_delay = false, unknown_track = false
WHERE train_number = :trainNumber AND train_departure_date = :trainDepartureDate AND attap_id = :attapId`;

const SQL_UPSERT_UDOT_VALUES = `
INSERT INTO rami_udot(train_number, train_departure_date, attap_id, unknown_delay, unknown_track)
VALUES (:trainNumber, :trainDepartureDate, :attapId, :ud, :ut)
ON DUPLICATE KEY UPDATE
    unknown_delay = :ud,
    unknown_track = :ut`;

const SQL_MERGE_HISTORY = `
insert into rami_udot_history(rami_message_id, train_number, train_departure_date, attap_id, unknown_track, unknown_delay)
select :messageId, train_number, train_departure_date, attap_id, :ut, :ud
from rami_udot
where train_number = :trainNumber and train_departure_date = :trainDepartureDate
and attap_id = :attapId;
`;

export interface UdotUpsertValues {
    readonly trainNumber: number
    readonly trainDepartureDate: string
    readonly attapId: number
    readonly messageId: string

    readonly ut: boolean
    readonly ud: boolean
}

export async function insertOrUpdate(conn: Connection, value: UdotUpsertValues): Promise<void> {    
    try {
        if(value.ud === false && value.ut === false) {                
            await conn.execute(SQL_UPDATE_FALSE_VALUES, value);
        } else {
            await conn.execute(SQL_UPSERT_UDOT_VALUES, value) 
        };

        await conn.execute(SQL_MERGE_HISTORY, value);
    } catch(error) {
        logger.error({
            method: "UdotDao.insertOrUpdate",
            error
        });        
    }

}

export async function deleteOldValues(conn: Connection): Promise<void> {
    await conn.execute(SQL_DELETE_OLD_UDOT_VALUES);
    await conn.execute(SQL_DELETE_OLD_UDOT_HISTORY_VALUES);
}