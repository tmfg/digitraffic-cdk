import { type DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Location } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";

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

const SQL_GET_LOCATIONS = `select id, name, type, locode_list, nationality, latitude, longitude, winterport
from wn_location where deleted = false`;

const PS_UPDATE_LOCATIONS = new pgPromise.PreparedStatement({
    name: "update-locations",
    text: SQL_UPDATE_LOCATIONS
});

const PS_GET_LOCATIONS = new pgPromise.PreparedStatement({
    name: "get-locations",
    text: SQL_GET_LOCATIONS
});

export async function saveAllLocations(db: DTDatabase, locations: Location[]): Promise<unknown> {
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
                l.winterport
            ]);
        })
    );
}

export async function getLocations(db: DTDatabase): Promise<Location[]> {
    return db.manyOrNone(PS_GET_LOCATIONS);
}
