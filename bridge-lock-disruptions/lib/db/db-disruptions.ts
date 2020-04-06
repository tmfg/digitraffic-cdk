import {IDatabase} from "pg-promise";
import {createGeometry, Location} from "../../../common/postgres/geometry";
import {stream} from "../../../common/db/stream-util";
import {Disruption, SpatialDisruption} from "../model/disruption";
import {Feature} from "geojson";

export interface DbDisruption {
    bridgelock_id: number;
    bridgelock_type_id: number;
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
const moment = require('moment');

const UPSERT_DISRUPTIONS_SQL = `
INSERT INTO bridgelock_disruption (
    bridgelock_id,
    bridgelock_type_id,
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
    $(bridgelock_id),
    $(bridgelock_type_id),
    $(start_date),
    $(end_date),
    $(geometry),
    $(description_fi),
    $(description_sv),
    $(description_en),
    $(additional_info_fi),
    $(additional_info_sv),
    $(additional_info_en)
) 
ON CONFLICT(bridgelock_id) DO 
UPDATE SET 
    bridgelock_type_id = $(bridgelock_type_id),
    start_date = $(start_date),
    end_date = $(end_date),
    geometry = $(geometry),
    description_fi = $(description_fi),
    description_sv = $(description_sv),
    description_en = $(description_en),
    additional_info_fi = $(additional_info_fi),
    additional_info_sv = $(additional_info_sv),
    additional_info_en = $(additional_info_en)
`;

const SELECT_DISRUPTION_SQL = `
SELECT
    bridgelock_id,
    bridgelock_type_id,
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

export async function findAll<T>(
    db: IDatabase<any, any>,
    conversion: (disruption: DbDisruption) => T): Promise<T[]>
{
    const qs = new QueryStream(SELECT_DISRUPTION_SQL);
    return await stream(db, qs, conversion);
}

export function updateDisruptions(db: IDatabase<any, any>, disruptions: Feature[]): Promise<any>[] {
    return disruptions.map(f => {
        const disruption: Disruption = f.properties as Disruption;
        const spatialDisruption: SpatialDisruption = {...disruption, ...{
           geometry: f.geometry as Location
        }};
        return db.none(UPSERT_DISRUPTIONS_SQL, createEditObject(spatialDisruption));
    });
}

function toHelsinkiTime(date: string|null): Date|null {
    if(date == null) {
        return null;
    }

    return moment(date, 'dd.MM.yyyy hh:mm').toDate();
}

export function createEditObject(disruption: SpatialDisruption): DbDisruption {
    return {
        bridgelock_id: disruption.Id,
        bridgelock_type_id: disruption.Type_Id,
        start_date: disruption.StartDate,
        end_date: disruption.EndDate,
        geometry: createGeometry(disruption.geometry),
        description_fi: disruption.DescriptionFi,
        description_sv: disruption.DescriptionSv,
        description_en: disruption.DescriptionEn,
        additional_info_fi: disruption.AdditionalInformationFi,
        additional_info_sv: disruption.AdditionalInformationSv,
        additional_info_en: disruption.AdditionalInformationEn
    };
}
