import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { ApiData, Source } from "../model/api-db-model.js";

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

const SQL_GET_SOURCES = `
  select id, name, shortname, nationality, type, vessel_id
  from wn_source where deleted = false
`;

const PS_UPDATE_SOURCES = new pgPromise.PreparedStatement({
  name: "update-sources",
  text: SQL_UPDATE_SOURCES,
});

export async function saveAllSources(
  db: DTDatabase,
  sources: ApiData<Source>[],
): Promise<void> {
  // Sequential awaits: parallel queries on one pg connection trigger the
  // "client is already executing a query" deprecation warning.
  for (const s of sources) {
    await db.any(PS_UPDATE_SOURCES, [
      s.id,
      s.name,
      s.shortname,
      s.nationality,
      s.type,
      s.vessel_id,
    ]);
  }
}

export async function getSources(db: DTDatabase): Promise<Source[]> {
  return db.any(SQL_GET_SOURCES);
}
