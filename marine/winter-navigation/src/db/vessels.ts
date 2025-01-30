import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Vessel } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_VESSELS = `
insert into wn_vessel(id, name, callsign, shortcode, imo, mmsi, type, deleted)
values ($1, $2, $3, $4, $5, $6, $7, false)
on conflict(id)
do update set
    name = $2,
    callsign = $3,
    shortcode = $4,
    imo = $5,
    mmsi = $6,
    type = $7,
    deleted = false
`;

const SQL_GET_VESSEL =
  `select id, name, callsign, shortcode, imo, mmsi, type, deleted
from wn_vessel
where id = $1`;

const SQL_GET_VESSELS =
  `select id, name, callsign, shortcode, imo, mmsi, type, deleted
from wn_vessel
where deleted = false`;

const PS_UPDATE_VESSELS = new pgPromise.PreparedStatement({
  name: "update-vessels",
  text: SQL_UPDATE_VESSELS,
});

const PS_GET_VESSEL = new pgPromise.PreparedStatement({
  name: "get-vessel",
  text: SQL_GET_VESSEL,
});

const PS_GET_VESSELS = new pgPromise.PreparedStatement({
  name: "get-vessels",
  text: SQL_GET_VESSELS,
});

export function saveAllVessels(
  db: DTDatabase,
  vessels: Vessel[],
): Promise<unknown> {
  return Promise.all(
    vessels.map(async (v) => {
      return db.any(PS_UPDATE_VESSELS, [
        v.id,
        v.name,
        v.callsign,
        v.shortcode,
        v.imo,
        v.mmsi,
        v.type,
      ]);
    }),
  );
}

export async function getVessel(
  db: DTDatabase,
  locationId: string,
): Promise<Vessel | undefined> {
  return await db.oneOrNone(PS_GET_VESSEL, [locationId]) ?? undefined;
}

export async function getVessels(db: DTDatabase): Promise<Vessel[]> {
  return db.manyOrNone(PS_GET_VESSELS);
}
