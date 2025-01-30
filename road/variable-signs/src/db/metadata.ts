import type { DbDevice } from "../model/device.js";
import type { DTTransaction } from "@digitraffic/common/dist/database/database";
import type { TloikLaite } from "../model/metatiedot.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_DEVICE = `
    update device
        set type = $2, road_address = $3, direction = $4, carriageway = $5, etrs_tm35fin_x = $6, etrs_tm35fin_y = $7, deleted_date = null
        where id = $1
`;

export async function updateDevice(
  db: DTTransaction,
  device: TloikLaite,
): Promise<void> {
  await db.none(SQL_UPDATE_DEVICE, [
    device.tunnus,
    device.tyyppi,
    device.sijainti.tieosoite,
    device.sijainti.ajosuunta,
    device.sijainti.ajorata,
    device.sijainti.e,
    device.sijainti.n,
  ]);
}

const SQL_INSERT_DEVICE = `
    insert into device(id, deleted_date, type, road_address, direction, carriageway, etrs_tm35fin_x, etrs_tm35fin_y)
    values ($1, null, $2, $3, $4, $5, $6, $7)
`;

export async function insertDevices(
  db: DTTransaction,
  devices: TloikLaite[],
): Promise<void> {
  await db.tx((t) =>
    t.batch(
      devices.map((d) =>
        db.none(SQL_INSERT_DEVICE, [
          d.tunnus,
          d.tyyppi,
          d.sijainti.tieosoite,
          d.sijainti.ajosuunta,
          d.sijainti.ajorata,
          d.sijainti.e,
          d.sijainti.n,
        ])
      ),
    )
  );
}

const SQL_GET_ALL_DEVICES = `
    select id, modified, deleted_date, type, road_address, direction, carriageway, etrs_tm35fin_x, etrs_tm35fin_y
    from device
`;

const PS_GET_ALL_DEVICES = new pgPromise.PreparedStatement({
  name: "get-all-devices",
  text: SQL_GET_ALL_DEVICES,
});

export function getAllDevices(db: DTTransaction): Promise<DbDevice[]> {
  return db.manyOrNone(PS_GET_ALL_DEVICES);
}

const SQL_REMOVE_DEVICES =
  "update device set deleted_date = current_timestamp where id in ($1:list)";

export async function removeDevices(
  db: DTTransaction,
  deviceIds: string[],
): Promise<void> {
  if (deviceIds.length > 0) {
    await Promise.all([db.none(SQL_REMOVE_DEVICES, [deviceIds])]);
  }
}
