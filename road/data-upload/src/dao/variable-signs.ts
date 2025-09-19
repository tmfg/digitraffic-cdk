import { default as pgPromise } from "pg-promise";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const PS_INSERT_VS = new pgPromise.PreparedStatement({
  name: "insert-vs",
  text: `insert into device_data_datex2(device_id, datex2, effect_date)
  values ($1, $2, $3)
    on conflict(device_id) do
    update set datex2 = $2, effect_date = $3`,
});

export async function insertDatex2(
  db: DTDatabase,
  deviceId: string,
  datex2: string,
  effectDate: Date,
): Promise<void> {
  // TODO: handle datex2-version

  await db.none(PS_INSERT_VS, [deviceId, datex2, effectDate]);
}
