import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { ApiData, DbData, Restriction } from "../model/api-db-model.js";

const SQL_UPDATE_RESTRICTIONS = `
insert into wn_restriction(id, location_id, text_compilation, start_time, end_time, deleted)
values ($1, $2, $3, $4, $5, false)
on conflict(id)
do update set
    location_id = $2,
    text_compilation = $3,
    start_time = $4,
    end_time = $5,
    deleted = false
`;

const SQL_GET_RESTRICTIONS = `select id, location_id, text_compilation, start_time, end_time
from wn_restriction where deleted = false`;

const PS_UPDATE_RESTRICTIONS = new pgPromise.PreparedStatement({
  name: "update-restrictions",
  text: SQL_UPDATE_RESTRICTIONS,
});

const PS_GET_RESTRICTIONS = new pgPromise.PreparedStatement({
  name: "get-restrictions",
  text: SQL_GET_RESTRICTIONS,
});

export function saveAllRestrictions(
  db: DTDatabase,
  restrictions: ApiData<Restriction>[],
): Promise<unknown> {
  return Promise.all(
    restrictions.map(async (r) => {
      return db.any(PS_UPDATE_RESTRICTIONS, [
        r.id,
        r.location_id,
        r.text_compilation,
        r.start_time,
        r.end_time,
      ]);
    }),
  );
}
export async function getRestrictions(
  db: DTDatabase,
): Promise<DbData<Restriction>[]> {
  return db.manyOrNone(PS_GET_RESTRICTIONS);
}
