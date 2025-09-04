import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { DataStatus } from "../model/types.js";

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
