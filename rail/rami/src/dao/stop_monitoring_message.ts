import type { Connection } from "mysql2/promise";

/*

create table rami_stop_monitoring_message(
	rami_message_id VARCHAR(36) PRIMARY KEY,
	created_db DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	train_number INT UNSIGNED NOT NULL,
    train_departure_date DATE NOT NULL,
    message TEXT NOT NULL
);

create index rsmm_train_number_i on rami_stop_monitoring_message(train_number, train_departure_date);
create index rsmm_created_i on rami_stop_monitoring(created_db);

*/

const SQL_INSERT_MESSAGE = `
INSERT INTO rami_stop_monitoring_message(rami_message_id, train_number, train_departure_date, message)
values (:id, :trainNumber, :trainDepartureDate, :message)`;

const SQL_DELETE_OLD_MESSAGES = `
DELETE FROM rami_stop_monitoring_message
WHERE created_db < current_date - INTERVAL 1 DAY`;

export async function deleteOldMessages(conn: Connection): Promise<void> {
    await conn.execute(SQL_DELETE_OLD_MESSAGES);
}

export async function insertMessage(conn: Connection, id: string, trainNumber: number, trainDepartureDate: string, message: string): Promise<void> {
    await conn.query(SQL_INSERT_MESSAGE, {
        id, trainNumber, trainDepartureDate, message
    });
}