import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { TableName } from "./deleted.js";

const SQL_UPDATE_DATA_VERSION = `
insert into wn_data_version(table_name, version, modified) 
values ($1, $2, now())
on conflict(table_name)
do update set
    version = $2,
    modified = now()`;

const SQL_GET_DATA_VERSION =
  `select version from wn_data_version where table_name = $1`;

const PS_UPDATE_DATA_VERSION = new pgPromise.PreparedStatement({
  name: "update-data-version",
  text: SQL_UPDATE_DATA_VERSION,
});

const PS_GET_DATA_VERSION = new pgPromise.PreparedStatement({
  name: "get-data-version",
  text: SQL_GET_DATA_VERSION,
});

export function updateDataVersion(
  db: DTDatabase,
  tableName: TableName,
  version: number,
): Promise<unknown> {
  return db.any(PS_UPDATE_DATA_VERSION, [tableName, version]);
}

interface Versionable {
  version: number;
}

export async function getDataVersion(
  db: DTDatabase,
  tableName: TableName,
): Promise<number> {
  return await db.oneOrNone(
    PS_GET_DATA_VERSION,
    [tableName],
    (row: Versionable) => {
      return row?.version;
    },
  ) ?? 0;
}
