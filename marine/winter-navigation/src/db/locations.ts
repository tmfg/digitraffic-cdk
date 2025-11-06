import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import type { ApiData, Location } from "../model/api-db-model.js";
import { default as pgPromise } from "pg-promise";
import type { LocationDTO } from "../model/dto-model.js";

const SQL_UPDATE_LOCATIONS = `
insert into wn_location(id, name, type, locode_list, nationality, latitude, longitude, winterport, deleted)
values ($1, $2, $3, $4, $5, $6, $7, $8, false)
on conflict(id)
do update set
    name = $2,
    type = $3,
    locode_list = $4,
    nationality = $5,
    latitude = $6,
    longitude = $7,
    winterport = $8,
    deleted = false
`;

const SQL_GET_LOCATIONS = `
WITH location_restrictions AS (
    SELECT
        r.location_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', r.id,
                'text_compilation', r.text_compilation,
                'start_time', r.start_time,
                'end_time', r.end_time
            )
        ) AS restrictions
    FROM wn_restriction r
    WHERE r.deleted = false
    GROUP BY r.location_id
),
location_suspensions AS (
    SELECT
        psl.location_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', ps.id,
                'start_time', ps.start_time,
                'end_time', ps.end_time,
                'prenotification', ps.prenotification,
                'ports_closed', ps.ports_closed,
                'due_to', ps.due_to,
                'specifications', ps.specifications
            )
        ) AS suspensions
    FROM wn_port_suspension ps
    JOIN wn_port_suspension_location psl ON ps.id = psl.suspension_id
    WHERE ps.deleted = false AND psl.deleted = false
    GROUP BY psl.location_id
)
SELECT
    l.id,
    l.name,
    l.type,
    l.locode_list,
    l.nationality,
    l.latitude,
    l.longitude,
    l.winterport,
    COALESCE(lr.restrictions, '[]'::json) AS restrictions,
    COALESCE(ls.suspensions, '[]'::json) AS suspensions
FROM
    wn_location l
LEFT JOIN location_restrictions lr ON l.id = lr.location_id
LEFT JOIN location_suspensions ls ON l.id = ls.location_id
WHERE
    l.deleted = false
    AND ($1::text IS NULL OR $1 = ANY(string_to_array(l.locode_list, ',')));
`;

const PS_UPDATE_LOCATIONS = new pgPromise.PreparedStatement({
  name: "update-locations",
  text: SQL_UPDATE_LOCATIONS,
});

const PS_GET_LOCATION = new pgPromise.PreparedStatement({
  name: "get-location",
  text: SQL_GET_LOCATIONS,
});

const PS_GET_LOCATIONS = new pgPromise.PreparedStatement({
  name: "get-locations",
  text: SQL_GET_LOCATIONS,
});

export async function saveAllLocations(
  db: DTDatabase,
  locations: ApiData<Location>[],
): Promise<unknown> {
  return Promise.all(
    locations.map(async (l) => {
      return db.any(PS_UPDATE_LOCATIONS, [
        l.id,
        l.name,
        l.type,
        l.locode_list,
        l.nationality,
        l.latitude,
        l.longitude,
        l.winterport,
      ]);
    }),
  );
}

export async function getLocation(
  db: DTDatabase,
  locode: string,
): Promise<LocationDTO | undefined> {
  return await db.oneOrNone(PS_GET_LOCATION, [locode]) ?? undefined;
}

export async function getLocations(
  db: DTDatabase,
): Promise<LocationDTO[]> {
  return db.manyOrNone(PS_GET_LOCATIONS, [null]);
}
