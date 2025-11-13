import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { DataStatus } from "../model/types.js";

export interface DataIncomingDb {
  readonly data_id: number;
  readonly source: string;
  readonly version: string;
  readonly type: string;
  readonly data: string;
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

const SQL_NEW_DATA = `select data_id, source, version, type, data
from data_incoming
where source = $1 and type in ($2:csv) and status = 'NEW'`;

export async function insertData(
  db: DTDatabase,
  messageId: string,
  source: string,
  version: string,
  type: string,
  data: string,
): Promise<void> {
  await db.none(PS_INSERT_DATA, [messageId, source, version, type, data]);
}

export async function deleteOldDataMessages(db: DTDatabase): Promise<void> {
  await db.none(PS_DELETE_OLD_DATA);
}

export async function getNewData(
  db: DTDatabase,
  source: string,
  types: string[],
): Promise<DataIncomingDb[]> {
  return await db.manyOrNone(SQL_NEW_DATA, [source, types]);
}

const PS_UPDATE_DATA = new pgPromise.PreparedStatement({
  name: "update-data",
  text: "update data_incoming set status = $2 where data_id = $1",
});

export async function updateStatus(
  db: DTDatabase,
  dataId: number,
  status: DataStatus,
): Promise<void> {
  await db.none(PS_UPDATE_DATA, [dataId, status]);
}
