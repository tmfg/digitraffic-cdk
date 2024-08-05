import type { Connection } from "mysql2/promise";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const SQL_DELETE_OLD_VALUES = `
DELETE FROM stop_monitoring
WHERE train_departure_date < current_date - INTERVAL 2 DAY`;

const SQL_UPDATE_FALSE_VALUES = `
UPDATE rami_udot
SET unknown_delay = false, unknown_track = false
WHERE train_number = :trainNumber AND departure_date = :trainDepartureDate AND attap_id = :attapId`;

const SQL_UPSERT_VALUES = `
INSERT INTO rami_udot(message_id, train_number, train_departure_date, attap_id, unknown_delay, unknown_track)
VALUES (:messageId, :trainNumber, :trainDepartureDate, :attapId, :ud, :ut)
ON DUPLICATE KEY UPDATE
    unknown_delay = :ud,
    unknown_track = :ut`;
/*

create table rami_udot (
    message_id VARCHAR(36) NOT NULL PRIMARY KEY,
    train_number INT UNSIGNED NOT NULL,
    train_departure_date DATE NOT NULL,
	attap_id BIGINT UNSIGNED NOT NULL, 
    created_db DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_db DATETIME ON UPDATE CURRENT_TIMESTAMP,
	unknown_track BOOLEAN NOT NULL, 
	unknown_delay BOOLEAN NOT NULL
);

create unique index rami_udot_at_u on rami_udot(train_departure_date, train_number, attap_id);
create index rami_udot_created_i on rami_udot(created_db);

*/

export interface UdotUpsertValues {
    readonly trainNumber: number
    readonly trainDepartureDate: string
    readonly attapId: number
    readonly messageId: string

    readonly ut: boolean
    readonly ud: boolean
}

export async function insertOrUpdate(conn: Connection, values: UdotUpsertValues[]): Promise<void> {
    await Promise.allSettled(values.map(async v => {
        try {
            if(v.ud === false && v.ut === false) {
                return conn.query(SQL_UPDATE_FALSE_VALUES, v);
            } else {
                return conn.query(SQL_UPSERT_VALUES, v) 
            };
        } catch(error) {
            logger.error({
                method: "UdotDao.insertOrUpdate",
                error
            });
        
            return Promise.reject(error);
        }
    }));
}

export async function deleteOldValues(conn: Connection): Promise<void> {
    await conn.execute(SQL_DELETE_OLD_VALUES);
}