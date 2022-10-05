import * as LastUpdatedDB from "@digitraffic/common/database/last-updated";
import * as FaultsDB from "../db/faults";
import * as S124Converter from "./s124-converter";
import {DTDatabase, inDatabaseReadonly} from "@digitraffic/common/database/database";
import {Geometry, LineString, Point} from "wkx";
import {Builder} from 'xml2js';
import {RtzVoyagePlan} from "@digitraffic/common/marine/rtz";
import {Feature, FeatureCollection, GeometryObject} from "geojson";
import {createFeatureCollection} from "@digitraffic/common/utils/geometry";
import {Language} from "@digitraffic/common/types/language";
import {DbFault} from "../model/fault";

export const ATON_DATA_TYPE = "ATON_FAULTS";

export type FaultProps = {
    readonly id: number
    // eslint-disable-next-line camelcase
    readonly entry_timestamp: Date
    // eslint-disable-next-line camelcase
    readonly fixed_timestamp: Date | null
    readonly type: string
    readonly domain: string
    readonly state: string
    readonly fixed: boolean
    // eslint-disable-next-line camelcase
    readonly aton_id: number
    // eslint-disable-next-line camelcase
    readonly aton_name_fi: string
    // eslint-disable-next-line camelcase
    readonly aton_name_sv: string
    // eslint-disable-next-line camelcase
    readonly aton_type: string
    // eslint-disable-next-line camelcase
    readonly fairway_number: number
    // eslint-disable-next-line camelcase
    readonly fairway_name_fi: string
    // eslint-disable-next-line camelcase
    readonly fairway_name_sv: string
    // eslint-disable-next-line camelcase
    readonly area_number: number
    // eslint-disable-next-line camelcase
    readonly area_description: string
}

export function findAllFaults(language: Language, fixedInHours: number): Promise<FeatureCollection> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const features = await FaultsDB.findAll(db, language, fixedInHours, convertFeature);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(features, lastUpdated);
    });
}

export async function getFaultS124ById(db: DTDatabase, faultId: number): Promise<string|null> {
    const start = Date.now();
    const fault = await FaultsDB.getFaultById(db, faultId);

    try {
        if (!fault) {
            return null;
        }

        return new Builder().buildObject(S124Converter.convertFault(fault));
    } finally {
        console.info("method=getFaultS124ById tookMs=%d", Date.now() - start);
    }
}

export async function findFaultIdsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<number[]> {
    const start = Date.now();
    const voyageLineString =
        new LineString(voyagePlan.route.waypoints
            .flatMap(w => w.waypoint.flatMap( wp => wp.position))
            .map(p => new Point(p.$.lon, p.$.lat)));
    const faultIds = await inDatabaseReadonly((db: DTDatabase) => {
        return FaultsDB.findFaultIdsByRoute(db, voyageLineString);
    });
    console.info("method=findFaultIdsForVoyagePlan tookMs=%d count=%d", Date.now() - start, faultIds.length);
    return faultIds;
}

function convertFeature(fault: DbFault): Feature {
    const properties: FaultProps = {
        id: fault.id,
        // eslint-disable-next-line camelcase
        entry_timestamp: fault.entry_timestamp,
        // eslint-disable-next-line camelcase
        fixed_timestamp: fault.fixed_timestamp,
        type: fault.aton_fault_type,
        domain: fault.domain,
        state: fault.state,
        fixed: fault.fixed,
        // eslint-disable-next-line camelcase
        aton_id: fault.aton_id,
        // eslint-disable-next-line camelcase
        aton_name_fi: fault.aton_name_fi,
        // eslint-disable-next-line camelcase
        aton_name_sv: fault.aton_name_sv,
        // eslint-disable-next-line camelcase
        aton_type: fault.aton_type,
        // eslint-disable-next-line camelcase
        fairway_number: fault.fairway_number,
        // eslint-disable-next-line camelcase
        fairway_name_fi: fault.fairway_name_fi,
        // eslint-disable-next-line camelcase
        fairway_name_sv: fault.fairway_name_sv,
        // eslint-disable-next-line camelcase
        area_number: fault.area_number,
        // eslint-disable-next-line camelcase
        area_description: fault.area_description,
    };

    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(fault.geometry, "hex")).toGeoJSON() as GeometryObject;

    return {
        type: "Feature",
        properties: properties,
        geometry,
    };
}
