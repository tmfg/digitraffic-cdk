import type { SpatialDisruption } from "../model/disruption.js";
import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import type { Geometry } from "geojson";

export interface DbDisruption {
  readonly id: number;
  readonly type_id: number;
  readonly start_date: Date;
  readonly end_date: Date;
  readonly geometry: string; // this is wkb when fetched from database
  readonly description_fi: string;
  readonly description_sv?: string;
  readonly description_en?: string;
}

// save with actual GeoJSON
interface DistruptionSaveObject extends Omit<DbDisruption, "geometry"> {
  geometry: Geometry;
}

const UPSERT_DISRUPTIONS_SQL = `
    INSERT INTO bridgelock_disruption as bd (
        id,
        type_id,
        start_date,
        end_date,
        geometry,
        description_fi,
        description_sv,
        description_en
    )
    VALUES (
               $(id),
               $(type_id),
               $(start_date),
               $(end_date),
               ST_GeomFromGeoJSON($(geometry)),
               $(description_fi),
               $(description_sv),
               $(description_en)
           )
    ON CONFLICT(id) DO
    UPDATE SET
        type_id = excluded.type_id,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        geometry = excluded.geometry,
        description_fi = excluded.description_fi,
        description_sv = excluded.description_sv,
        description_en = excluded.description_en
    WHERE bd IS DISTINCT FROM excluded
`;

const SELECT_DISRUPTION_SQL = `
    SELECT
        id,
        type_id,
        start_date,
        end_date,
        geometry,
        description_fi,
        description_sv,
        description_en
    FROM bridgelock_disruption
`;

export function findAll(
  db: DTDatabase | DTTransaction,
): Promise<DbDisruption[]> {
  return db.tx((t) => t.manyOrNone(SELECT_DISRUPTION_SQL));
}

export function updateDisruptions(
  db: DTTransaction | DTDatabase,
  disruptions: SpatialDisruption[],
): Promise<number>[] {
  return disruptions.map((disruption) => {
    return db.result(
      UPSERT_DISRUPTIONS_SQL,
      createEditObject(disruption),
      (r) => r.rowCount,
    );
  });
}

export function deleteAllButDisruptions(
  db: DTTransaction | DTDatabase,
  ids: number[],
): Promise<number> {
  if (ids.length === 0) {
    return db.tx((t) =>
      t.result("DELETE FROM bridgelock_disruption", [], (r) => r.rowCount)
    );
  } else {
    return db.tx((t) =>
      t.result("DELETE FROM bridgelock_disruption WHERE id NOT IN ($1:csv)", [
        ids,
      ], (r) => r.rowCount)
    );
  }
}

export function createEditObject(
  disruption: SpatialDisruption,
): DistruptionSaveObject {
  return {
    id: disruption.Id,
    type_id: disruption.Type_Id,
    start_date: disruption.StartDate,
    end_date: disruption.EndDate,
    geometry: disruption.geometry,
    description_fi: disruption.DescriptionFi,
    description_sv: disruption.DescriptionSv,
    description_en: disruption.DescriptionEn,
  };
}
