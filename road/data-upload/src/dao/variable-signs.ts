import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { SOURCES, TYPES } from "../model/types.js";
import type { D2IncomingDb } from "./data.js";

const PS_UNHANDLED_VS = new pgPromise.PreparedStatement({
  name: "get-vs",
  text: `select data_id, source, version, type, datex2
from d2_incoming
where source = $1 and type = $2 and processed_at is null`,
});

const PS_UPDATE_DATA = new pgPromise.PreparedStatement({
  name: "update-data",
  text: "update data_incoming set status = $2 where data_id = $1",
});

export async function getUnhandled(db: DTDatabase): Promise<D2IncomingDb[]> {
  return await db.manyOrNone(PS_UNHANDLED_VS, [SOURCES.API, TYPES.VS]);
}

export async function updateStatus(
  db: DTDatabase,
  dataId: number,
  status: string,
): Promise<void> {
  await db.none(PS_UPDATE_DATA, [dataId, status]);
}
