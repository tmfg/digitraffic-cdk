import {IDatabase} from "pg-promise";
import {stream} from "../../../common/db/stream-util";
import {Disruption, SpatialDisruption} from "../model/disruption";
import {Feature, Geometry as GeoJSONGeometry} from "geojson";
import {Geometry} from "wkx";

export interface DbDisruption {
    id: number;
    type_id: number;
    start_date: Date;
    end_date: Date;
    geometry: any;
    description_fi: string;
    description_sv?: string;
    description_en?: string;
    additional_info_fi?: string;
    additional_info_sv?: string;
    additional_info_en?: string;
}

const QueryStream = require('pg-query-stream');

const UPSERT_DISRUPTIONS_SQL = `
    INSERT INTO bridgelock_disruption (
        id,
        type_id,
        start_date,
        end_date,
        geometry,
        description_fi,
        description_sv,
        description_en,
        additional_info_fi,
        additional_info_sv,
        additional_info_en
    )
    VALUES (
               $(id),
               $(type_id),
               $(start_date),
               $(end_date),
               ST_GeomFromGeoJSON($(geometry)),
               $(description_fi),
               $(description_sv),
               $(description_en),
               $(additional_info_fi),
               $(additional_info_sv),
               $(additional_info_en)
           )
    ON CONFLICT(id) DO
    UPDATE SET
        type_id = $(type_id),
        start_date = $(start_date),
        end_date = $(end_date),
        geometry = ST_GeomFromGeoJSON($(geometry)),
        description_fi = $(description_fi),
        description_sv = $(description_sv),
        description_en = $(description_en),
        additional_info_fi = $(additional_info_fi),
        additional_info_sv = $(additional_info_sv),
        additional_info_en = $(additional_info_en)
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
        description_en,
        additional_info_fi,
        additional_info_sv,
        additional_info_en
    FROM bridgelock_disruption
`;

export async function findAll(
    db: IDatabase<any, any>): Promise<Feature[]>
{
    const qs = new QueryStream(SELECT_DISRUPTION_SQL);
    return await stream(db, qs, convertFeature);
}

export function updateDisruptions(db: IDatabase<any, any>, disruptions: SpatialDisruption[]): Promise<any>[] {
    return disruptions.map(disruption => {
        return db.none(UPSERT_DISRUPTIONS_SQL, createEditObject(disruption));
    });
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
        additional_info_fi: disruption.AdditionalInformationFi,
        additional_info_sv: disruption.AdditionalInformationSv,
        additional_info_en: disruption.AdditionalInformationEn
    };
}

export function convertFeature(disruption: DbDisruption): Feature {
    const properties: Disruption = {
        Id: disruption.id,
        Type_Id: disruption.type_id,
        StartDate: disruption.start_date,
        EndDate: disruption.end_date,
        DescriptionFi: disruption.description_fi,
        DescriptionSv: disruption.description_sv,
        DescriptionEn: disruption.description_en,
        AdditionalInformationFi: disruption.additional_info_fi,
        AdditionalInformationSv: disruption.additional_info_sv,
        AdditionalInformationEn: disruption.additional_info_en
    };
    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(disruption.geometry, "hex")).toGeoJSON() as GeoJSONGeometry;
    return {
        type: "Feature",
        properties,
        geometry
    };
}
