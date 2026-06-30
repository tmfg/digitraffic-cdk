import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { default as pgPromise } from "pg-promise";
import type { ApiData, Dirway, Dirwaypoint } from "../model/api-db-model.js";
import type { DirwayDTO } from "../model/dto-model.js";

const SQL_UPDATE_DIRWAYS = `
insert into wn_dirway(id, name, description, deleted)
values ($1, $2, $3, false)
on conflict(id)
do update set
    name = $2,
    description = $3,
    deleted = false
`;

const SQL_UPDATE_DIRWAYPOINTS = `
insert into wn_dirwaypoint(id, dirway_id, order_num, name, latitude, longitude, deleted)
values ($1, $2, $3, $4, $5, $6, false)
on conflict(id)
do update set
    dirway_id = $2,
    order_num = $3,
    name = $4,
    latitude = $5,
    longitude = $6,
    deleted = false
`;

const SQL_GET_DIRWAYS = `
SELECT 
  d.id, d.name, d.description,
  JSON_AGG(JSON_BUILD_OBJECT(
    'order_num', p.order_num,
    'name', p.name,
    'latitude', p.latitude,
    'longitude', p.longitude  
  )) as dirwaypoints
FROM wn_dirway d
JOIN wn_dirwaypoint p ON d.id = p.dirway_id
WHERE d.deleted = FALSE AND p.deleted = false
GROUP BY d.id
`;

const PS_UPDATE_DIRWAYS = new pgPromise.PreparedStatement({
  name: "update-dirways",
  text: SQL_UPDATE_DIRWAYS,
});

const PS_UPDATE_DIRWAYPOINTS = new pgPromise.PreparedStatement({
  name: "update-dirwaypoints",
  text: SQL_UPDATE_DIRWAYPOINTS,
});

const PS_GET_DIRWAYS = new pgPromise.PreparedStatement({
  name: "get-dirways",
  text: SQL_GET_DIRWAYS,
});

export async function saveAllDirways(
  db: DTDatabase,
  dirways: ApiData<Dirway>[],
): Promise<void> {
  // Sequential awaits: parallel queries on one pg connection trigger the
  // "client is already executing a query" deprecation warning.
  for (const d of dirways) {
    await db.any(PS_UPDATE_DIRWAYS, [d.id, d.name, d.description]);
  }
}

export async function saveAllDirwaypoints(
  db: DTDatabase,
  dirwaypoints: ApiData<Dirwaypoint>[],
): Promise<void> {
  // Sequential awaits: parallel queries on one pg connection trigger the
  // "client is already executing a query" deprecation warning.
  for (const d of dirwaypoints) {
    await db.any(PS_UPDATE_DIRWAYPOINTS, [
      d.id,
      d.dirway_id,
      d.order_num,
      d.name,
      d.latitude,
      d.longitude,
    ]);
  }
}

export async function getDirways(db: DTDatabase): Promise<DirwayDTO[]> {
  return db.manyOrNone(PS_GET_DIRWAYS);
}
