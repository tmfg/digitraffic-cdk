import * as LastUpdatedDB from "../../../common/db/last-updated";
import * as DisruptionsDB from "../db/db-disruptions"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {Feature, FeatureCollection, GeoJSON} from "geojson";
import {SpatialDisruption} from "../model/disruption";
import {getDisruptions} from '../api/get-disruptions';
import moment from "moment";
import {createFeatureCollection} from "../../../common/api/geojson";

const GeoJsonValidator = require('geojson-validation');

export const DISRUPTIONS_DATE_FORMAT = 'D.M.YYYY H:mm';
const BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE = "BRIDGE_LOCK_DISRUPTIONS";

export async function findAllDisruptions(): Promise<FeatureCollection> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const disruptions = await DisruptionsDB.findAll(db);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE);
        return createFeatureCollection(disruptions, lastUpdated);
    }).finally(() => {
        console.info("method=findAllDisruptions tookMs=%d", (Date.now() - start));
    });
}

export async function saveDisruptions(disruptions: SpatialDisruption[]) {
    const start = Date.now();
    await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(t => {
            return t.batch(
                DisruptionsDB.updateDisruptions(db, disruptions),
                LastUpdatedDB.updateUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveDisruptions updatedCount=%d tookMs=%d", a.length, (end - start));
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
