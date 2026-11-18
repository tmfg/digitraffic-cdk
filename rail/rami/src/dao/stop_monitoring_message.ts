import type { Connection, ResultSetHeader } from "mysql2/promise";

const SQL_INSERT_MESSAGE = `
INSERT INTO rami_stop_monitoring_message(rami_message_id, train_number, train_departure_date, message)
values (:id, :trainNumber, :trainDepartureDate, :message)`;

const SQL_DELETE_OLD_MESSAGES = `
DELETE FROM rami_stop_monitoring_message
WHERE created_db < current_timestamp() - INTERVAL 1 DAY
LIMIT 50000`;

export async function deleteOldMessages(conn: Connection): Promise<number> {
  const [header] = await conn.execute<ResultSetHeader>(SQL_DELETE_OLD_MESSAGES);
  return header.affectedRows;
}

export async function insertMessage(
  conn: Connection,
  id: string,
  trainNumber: number,
  trainDepartureDate: string,
  message: string,
): Promise<void> {
  await conn.execute(SQL_INSERT_MESSAGE, {
    id,
    trainNumber,
    trainDepartureDate,
    message,
  });
}
