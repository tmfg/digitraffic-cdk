import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { PortSuspension, PortSuspensionLocation } from "../model/apidata.js";
import type { PortSuspensionWithLocations} from "../model/db-models.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_SUSPENSIONS = `
insert into wn_port_suspension(id, start_time, end_time, prenotification, ports_closed, due_to, specifications, deleted)
values ($1, $2, $3, $4, $5, $6, $7, false)
on conflict(id)
do update set
    start_time = $2,
    end_time = $3,
    prenotification = $4,
    ports_closed = $5,
    due_to = $6,
    specifications = $7,
    deleted = false
`;

const SQL_UPDATE_SUSPENSION_LOCATIONS = `
insert into wn_port_suspension_location(id, suspension_id, location_id, deleted)
values ($1, $2, $3, false)
on conflict(id)
do nothing`;

const SQL_GET_SUSPENSIONS = `select ps.id, start_time, end_time, prenotification, ports_closed, due_to, specifications, location_id 
from wn_port_suspension ps, wn_port_suspension_location wpsl 
where wpsl.suspension_id = ps.id
and ps.deleted = false 
and wpsl.deleted = false 
order by ps.id, wpsl.id`;

const PS_UPDATE_SUSPENSIONS = new pgPromise.PreparedStatement({
    name: "update-suspensions",
    text: SQL_UPDATE_SUSPENSIONS
});

const PS_UPDATE_SUSPENSION_LOCATIONS = new pgPromise.PreparedStatement({
    name: "update-suspension-locations",
    text: SQL_UPDATE_SUSPENSION_LOCATIONS
});

const PS_GET_SUSPENSIONS = new pgPromise.PreparedStatement({
    name: "get-suspensions",
    text: SQL_GET_SUSPENSIONS
});

export function saveAllPortSuspensions(db: DTDatabase, suspensions: PortSuspension[]): Promise<unknown> {
    return Promise.all(
        suspensions.map(async (s) => {
            return db.any(PS_UPDATE_SUSPENSIONS, [s.id, s.start_time, s.end_time, s.prenotification, s.ports_closed, s.due_to, s.specifications]);
        })
    );
}

export function saveAllPortSuspensionLocations(db: DTDatabase, locations: PortSuspensionLocation[]): Promise<unknown> {
    return Promise.all(
        locations.map(async (l) => {
            return db.any(PS_UPDATE_SUSPENSION_LOCATIONS, [l.id, l.suspension_id, l.location_id]);
        })
    );
}

export async function getSuspensions(db: DTDatabase): Promise<PortSuspensionWithLocations[]> {
    return db.manyOrNone(PS_GET_SUSPENSIONS);
}

