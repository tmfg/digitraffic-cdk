import type { Connection } from "mysql2/promise";

const SQL_INSERT_MESSAGE = `
INSERT INTO stop_monitoring_message(id, train_number, train_departure_date, message)
values (:id, :trainNumber, :trainDepartureDate, :message)`;

const SQL_DELETE_OLD_MESSAGES = `
DELETE FROM stop_monitoring_messages
WHERE created_db < current_date - INTERVAL 1 DAY`;

const SQL_DELETE_OLD_VALUES = `
DELETE FROM stop_monitoring
WHERE train_departure_date < current_date - INTERVAL 2 DAY`;

const SQL_UPDATE_FALSE_VALUES = `
UPDATE stop_monitoring
SET unknown_quay = false, unknown_time = false
WHERE train_number = :trainNumber AND departure_date = :trainDepartureDate AND attap_id = :attapId`;

const SQL_UPSERT_VALUES = `
INSERT INTO stop_monitoring(train_number, train_departure_date, attap_id, unknown_track, unknown_delay, created_message_id)
VALUES (:trainNumber, :trainDepartureDate, :attapId, :ut, :ud, :messageId)
ON DUPLICATE KEY UPDATE
    unknown_track = :ut,
    unknown_delay = :ud`;

    // TODO: create table
/*create table stop_monitoring (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    train_number INT UNSIGNED NOT NULL,
    train_departure_date DATE NOT NULL,
	attap_id BIGINT UNSIGNED NOT NULL, 
    created_db DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_db DATETIME ON UPDATE CURRENT_TIMESTAMP,
	unknown_track BOOLEAN NOT NULL, 
	unknown_delay BOOLEAN NOT NULL
);

create unique index stop_monitoring_at_u on stop_monitoring(train_number, train_departure_date, attap_id);

*/

export interface UpsertValues {
    readonly trainNumber: number
    readonly trainDepartureDate: string
    readonly attapId: number
    readonly messageId: string

    readonly ut: boolean
    readonly ud: boolean
}

export async function insertOrUpdate(conn: Connection, values: UpsertValues[]): Promise<void> {
    await Promise.allSettled(values.map(async v => {
        if(v.ut === false && v.ud === false) {
            return conn.query(SQL_UPDATE_FALSE_VALUES, v);
        } else {
            return conn.query(SQL_UPSERT_VALUES, v) 
        };
    }));
}

export async function deleteOldValues(conn: Connection): Promise<void> {
    await conn.execute(SQL_DELETE_OLD_VALUES);
}

export async function deleteOldMessages(conn: Connection): Promise<void> {
    await conn.execute(SQL_DELETE_OLD_MESSAGES);
}

export async function insertMessage(conn: Connection, id: string, trainNumber: number, trainDepartureDate: string, message: string): Promise<void> {
    await conn.query(SQL_INSERT_MESSAGE, {
        id, trainNumber, trainDepartureDate, message
    });
}