import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as DisruptionsDB from "../db/db-disruptions"
import {DbDisruption} from "../db/db-disruptions"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {Feature, GeoJSON, Geometry as GeoJSONGeometry} from "geojson";
import {Geometry} from "wkx";
import {Disruption, SpatialDisruption} from "../model/disruption";
import {getDisruptions} from '../api/get-disruptions';
import moment from "moment";

const GeoJsonValidator = require('geojson-validation');

export const DISRUPTIONS_DATE_FORMAT = 'D.M.YYYY H:mm';
const BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE = "BRIDGE_LOCK_DISRUPTIONS";

export async function findAllDisruptions(): Promise<Disruptions> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const disruptions = await DisruptionsDB.findAll(db, d => d);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE);
        return {
            disruptions,
            lastUpdated
        };
    }).finally(() => {
        console.info("method=findAllDisruptions tookMs=%d", (Date.now()-start));
    });
}

export async function saveDisruptions(disruptions: SpatialDisruption[]) {
    const start = Date.now();
    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch(
                DisruptionsDB.updateDisruptions(db, disruptions),
                LastUpdatedDB.updateUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveDisruptions updatedCount=%d tookMs=%d", a.length, (end-start));
    });
}

export async function fetchRemoteDisruptions(endpointUrl: string) {
    const disruptions = await getDisruptions(endpointUrl);
    const validDisruptions = disruptions.filter(validateGeoJson);
    return validDisruptions.map(featureToDisruption);
}

export function featureToDisruption(feature: Feature): SpatialDisruption {
    const props = feature.properties as any;
    return {
        Id: props.Id,
        Type_Id: props.Type_Id,
        StartDate: normalizeDisruptionDate(props.StartDate),
        EndDate: normalizeDisruptionDate(props.EndDate),
        DescriptionFi: props.DescriptionFi,
        DescriptionSv: props.DescriptionSv,
        DescriptionEn: props.DescriptionEn,
        AdditionalInformationFi: props.AdditionalInformationFi,
        AdditionalInformationSv: props.AdditionalInformationSv,
        AdditionalInformationEn: props.AdditionalInformationEn,
        geometry: feature.geometry
    };
}

export function normalizeDisruptionDate(dateStr: string): Date {
    return moment(dateStr, DISRUPTIONS_DATE_FORMAT).toDate();
}

export function validateGeoJson(geoJson: GeoJSON) {
    try {
        return GeoJsonValidator.valid(geoJson);
    } catch (e) {
        console.warn('Invalid GeoJSON', geoJson);
        return false;
    }
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

interface Disruptions {
    readonly disruptions: DbDisruption[];
    readonly lastUpdated: Date | null;
}
