import type { Connection } from "mysql2/promise";

const UPSERT = `
INSERT INTO stop_monitoring(train_number, train_departure_date, attap_id, unknown_quay, unknown_time)
VALUES (:trainNumber, :trainDepartureDate, :attapId, :uq, :ut)
ON DUPLICATE KEY UPDATE
    unknown_quay = :uq,
    unknown_time = :ut`;

    // TODO: create table
/*create table stop_monitoring (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    train_number INT UNSIGNED NOT NULL,
    train_departure_date DATE NOT NULL,
	attap_id BIGINT UNSIGNED NOT NULL, 
	modified_db DATETIME ON UPDATE CURRENT_TIMESTAMP,
	unknown_quay BOOLEAN NOT NULL, 
	unknown_time BOOLEAN NOT NULL
);*/

export interface UpsertValues {
    readonly trainNumber: number
    readonly trainDepartureDate: string
    readonly attapId: number
    readonly uq: boolean
    readonly ut: boolean
}

export async function insertOrUpdate(conn: Connection, values: UpsertValues[]): Promise<void> {
    await Promise.allSettled(values.map(async v => await conn.query(UPSERT, v)));
}