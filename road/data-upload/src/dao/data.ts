import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export interface D2IncomingDb {
  data_id: number;
}

const PS_INSERT_DATA = new pgPromise.PreparedStatement({
  name: "insert-data",
  text:
    "insert into data_incoming(message_id, source, version, type, data, status) values ($1, $2, $3, $4, $5, 'NEW')",
});

const PS_DELETE_OLD_DATA = new pgPromise.PreparedStatement({
  name: "delete-old-data",
  text:
    "delete from data_incoming where created_at < (current_date - interval '7 days')",
});

export async function insertDatex2(
  db: DTDatabase,
  messageId: string,
  source: string,
  version: string,
  type: string,
  datex2: string,
): Promise<void> {
  await db.none(PS_INSERT_DATA, [messageId, source, version, type, datex2]);
}

export async function deleteOldDatex2Messages(db: DTDatabase): Promise<void> {
  await db.none(PS_DELETE_OLD_DATA);
}
