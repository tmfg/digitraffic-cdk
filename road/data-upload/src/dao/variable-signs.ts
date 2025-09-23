import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const PS_INSERT_VS = new pgPromise.PreparedStatement({
  name: "insert-vs",
  text: `insert into device_data_datex2(device_id, version, datex2, effect_date)
  values ($1, $2, $3, $4)
    on conflict(device_id, version) do
    update set datex2 = $3, effect_date = $4`,
});

export async function updateDatex2(
  db: DTDatabase,
  deviceId: string,
  version: string,
  datex2: string,
  effectDate: Date,
): Promise<void> {
  await db.none(PS_INSERT_VS, [deviceId, version, datex2, effectDate]);
}
