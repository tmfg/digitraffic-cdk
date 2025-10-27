import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type {
  ApiData,
  PortSuspensionLocation,
  Suspension,
} from "../model/api-db-model.js";
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

const PS_UPDATE_SUSPENSIONS = new pgPromise.PreparedStatement({
  name: "update-suspensions",
  text: SQL_UPDATE_SUSPENSIONS,
});

const PS_UPDATE_SUSPENSION_LOCATIONS = new pgPromise.PreparedStatement({
  name: "update-suspension-locations",
  text: SQL_UPDATE_SUSPENSION_LOCATIONS,
});

export function saveAllPortSuspensions(
  db: DTDatabase,
  suspensions: ApiData<Suspension>[],
): Promise<unknown> {
  return Promise.all(
    suspensions.map(async (s) => {
      return db.any(PS_UPDATE_SUSPENSIONS, [
        s.id,
        s.start_time,
        s.end_time,
        s.prenotification,
        s.ports_closed,
        s.due_to,
        s.specifications,
      ]);
    }),
  );
}

export function saveAllPortSuspensionLocations(
  db: DTDatabase,
  locations: ApiData<PortSuspensionLocation>[],
): Promise<unknown> {
  return Promise.all(
    locations.map(async (l) => {
      return db.any(PS_UPDATE_SUSPENSION_LOCATIONS, [
        l.id,
        l.suspension_id,
        l.location_id,
      ]);
    }),
  );
}
