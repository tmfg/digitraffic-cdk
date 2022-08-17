import {SpatialDisruption} from "../model/disruption";
import {DTDatabase} from "digitraffic-common/database/database";

export interface DbDisruption {
    id: number;
    type_id: number;
    start_date: Date;
    end_date: Date;
    geometry: any;
    description_fi: string;
    description_sv?: string;
    description_en?: string;
}

const UPSERT_DISRUPTIONS_SQL = `
    INSERT INTO bridgelock_disruption (
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
        type_id = $(type_id),
        start_date = $(start_date),
        end_date = $(end_date),
        geometry = ST_GeomFromGeoJSON($(geometry)),
        description_fi = $(description_fi),
        description_sv = $(description_sv),
        description_en = $(description_en)
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

export function findAll(db: DTDatabase): Promise<DbDisruption[]> {
    return db.tx(t => t.manyOrNone(SELECT_DISRUPTION_SQL));
}

export function updateDisruptions(db: DTDatabase, disruptions: SpatialDisruption[]): Promise<null>[] {
    return disruptions.map(disruption => {
        return db.none(UPSERT_DISRUPTIONS_SQL, createEditObject(disruption));
    });
}

export function deleteAllButDisruptions(db: DTDatabase, ids: number[]): Promise<null> {
    if (ids.length === 0) {
        return db.tx(t => t.none('DELETE FROM bridgelock_disruption'));
    } else {
        return db.tx(t => t.none('DELETE FROM bridgelock_disruption WHERE id NOT IN ($1:csv)', ids));
    }
}

export function createEditObject(disruption: SpatialDisruption): DbDisruption {
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
