import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { Source } from "../model/apidata.js";
import { default as pgPromise } from "pg-promise";

const SQL_UPDATE_SOURCES = `
insert into wn_source(id, name, shortname, nationality, type, vessel_id, deleted)
values ($1, $2, $3, $4, $5, $6, false)
on conflict(id)
do update set
    name = $2,
    shortname = $3,
    nationality = $4,
    type = $5,
    vessel_id = $6,
    deleted = false
`;

const PS_UPDATE_SOURCES = new pgPromise.PreparedStatement({
  name: "update-sources",
  text: SQL_UPDATE_SOURCES,
});

export function saveAllSources(
  db: DTDatabase,
  sources: Source[],
): Promise<unknown> {
  return Promise.all(
    sources.map(async (s) => {
      return db.any(PS_UPDATE_SOURCES, [
        s.id,
        s.name,
        s.shortname,
        s.nationality,
        s.type,
        s.vessel_id,
      ]);
    }),
  );
}
