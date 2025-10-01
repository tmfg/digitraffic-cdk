import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { DatexType } from "../service/variable-signs.js";

const PS_INSERT_VS = new pgPromise.PreparedStatement({
  name: "insert-vs",
  text:
    `insert into device_data_datex2(device_id, version, type, datex2, effect_date)
  values ($1, $2, $3, $4, $5)
    on conflict(device_id, version, type) do
    update set datex2 = $4, effect_date = $5`,
});

export async function updateDatex2(
  db: DTDatabase,
  deviceId: string,
  version: string,
  type: DatexType,
  datex2: string,
  effectDate: Date,
): Promise<void> {
  await db.none(PS_INSERT_VS, [deviceId, version, type, datex2, effectDate]);
}
