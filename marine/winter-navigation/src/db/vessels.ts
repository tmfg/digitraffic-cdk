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

const PS_UPDATE_VESSELS = new pgPromise.PreparedStatement({
    name: "update-vessels",
    text: SQL_UPDATE_VESSELS
});

export function saveAllVessels(db: DTDatabase, vessels: Vessel[]): Promise<unknown> {
    return Promise.all(
        vessels.map(async (v) => {
            return db.any(PS_UPDATE_VESSELS, [v.id, v.name, v.callsign, v.shortcode, v.imo, v.mmsi, v.type]);
        })
    );
}
