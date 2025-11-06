import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Deleted } from "../model/api-db-model.js";

const SQL_SET_DELETED =
  `update $1:name set deleted = true where id in ($2:csv)`;

export type TableName =
  | "wn_location"
  | "wn_restriction"
  | "wn_vessel"
  | "wn_activity"
  | "wn_source"
  | "wn_port_suspension"
  | "wn_port_suspension_location"
  | "wn_queue"
  | "wn_dirway"
  | "wn_dirwaypoint";

export function setDeleted(
  db: DTDatabase,
  tableName: TableName,
  deleted: Deleted[],
): unknown {
  const idList = deleted.map((d) => d.id);

  return db.none(SQL_SET_DELETED, [tableName, idList]);
}
