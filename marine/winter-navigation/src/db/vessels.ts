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

const SQL_GET_VESSEL = `SELECT
  v.id,
  v.name,
  v.callsign,
  v.shortcode,
  v.imo,
  v.mmsi,
  v.type,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'start_time', q.start_time,
        'end_time', q.end_time,
        'order_num', q.order_num,
        'icebreaker_id', ib_vessel.id,
        'icebreaker_imo', ib_vessel.imo,
        'icebreaker_mmsi', ib_vessel.mmsi,
        'vessel_id', assisted_vessel.id,
        'vessel_imo', assisted_vessel.imo,
        'vessel_mmsi', assisted_vessel.mmsi
      )
    ) FILTER (WHERE q.id IS NOT NULL),
    '[]'::json
  ) AS queues
FROM
  wn_vessel v
    LEFT JOIN
  wn_queue q ON q.vessel_id = v.id OR q.icebreaker_id IN (SELECT s.id FROM wn_source s WHERE s.vessel_id = v.id) AND q.deleted = false
    LEFT JOIN
  wn_source s ON q.icebreaker_id = s.id
    LEFT JOIN
  wn_vessel assisted_vessel ON q.vessel_id = assisted_vessel.id
    LEFT JOIN
  wn_vessel ib_vessel ON s.vessel_id = ib_vessel.id
WHERE
  v.deleted = false AND v.id = $1
GROUP BY
  v.id;
`;

const SQL_GET_VESSELS = `SELECT
  v.id,
  v.name,
  v.callsign,
  v.shortcode,
  v.imo,
  v.mmsi,
  v.type,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'start_time', q.start_time,
        'end_time', q.end_time,
        'order_num', q.order_num,
        'icebreaker_id', ib_vessel.id,
        'icebreaker_imo', ib_vessel.imo,
        'icebreaker_mmsi', ib_vessel.mmsi,
        'vessel_id', assisted_vessel.id,
        'vessel_imo', assisted_vessel.imo,
        'vessel_mmsi', assisted_vessel.mmsi
      )
    ) FILTER (WHERE q.id IS NOT NULL),
    '[]'::json
  ) AS queues
FROM
  wn_vessel v
    LEFT JOIN
  wn_queue q ON q.vessel_id = v.id OR q.icebreaker_id IN (SELECT s.id FROM wn_source s WHERE s.vessel_id = v.id) AND q.deleted = false
    LEFT JOIN
  wn_source s ON q.icebreaker_id = s.id
    LEFT JOIN
  wn_vessel assisted_vessel ON q.vessel_id = assisted_vessel.id
    LEFT JOIN
  wn_vessel ib_vessel ON s.vessel_id = ib_vessel.id
WHERE
  v.deleted = false
GROUP BY
  v.id;`;

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
