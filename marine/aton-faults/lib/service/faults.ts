import * as LastUpdatedDB from "digitraffic-common/db/last-updated";
import * as FaultsDB from "../db/faults"
import * as S124Converter from "./s124-converter";
import {inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import {Geometry, LineString, Point} from "wkx";
import {Builder} from 'xml2js';
import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {Feature, FeatureCollection, GeometryObject} from "geojson";
import {createFeatureCollection} from "digitraffic-common/api/geojson";
import {Language} from "digitraffic-common/model/language";

export type FaultProps = {
    readonly id: number
    readonly entry_timestamp: Date
    readonly fixed_timestamp: Date
    readonly type: string
    readonly domain: string
    readonly state: string
    readonly fixed: boolean
    readonly aton_id: string
    readonly aton_name_fi: string
    readonly aton_name_sv: string
    readonly aton_type: string
    readonly fairway_number: number
    readonly fairway_name_fi: number
    readonly fairway_name_sv: number
    readonly area_number: number
    readonly area_description: string
}

const ATON_DATA_TYPE = "ATON_FAULTS";

export async function findAllFaults(language: Language, fixedInHours: number): Promise<FeatureCollection> {
    return await inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        const features = await FaultsDB.findAll(db, language, fixedInHours, convertFeature);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_DATA_TYPE);

        return createFeatureCollection(features, lastUpdated);
    });
}

export async function getFaultS124ById(faultId: number): Promise<string> {
    const start = Date.now();

    const fault = await inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        return await FaultsDB.getFaultById(db, faultId);
    });

    try {
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
    const faultIds = await inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        return FaultsDB.findFaultIdsByRoute(db, voyageLineString);
    });
    console.info("method=findFaultIdsForVoyagePlan tookMs=%d count=%d", Date.now() - start, faultIds.length);
    return faultIds;
}

export async function saveFaults(domain: string, newFaults: any[]) {
    const start = Date.now();
    const validated = newFaults.filter(validate);

    await inDatabase(async (db: IDatabase<any,any>) => {
        return await db.tx(t => {
            return t.batch([
                ...FaultsDB.updateFaults(db, domain, validated),
                LastUpdatedDB.updateUpdatedTimestamp(db, ATON_DATA_TYPE, new Date(start))
            ]);
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveFaults receivedCount=%d updatedCount=%d tookMs=%d", newFaults.length, a.length - 1, (end - start));
    })
}

function convertFeature(fault: any): Feature {
    const properties: FaultProps = {
        id: fault.id,
        entry_timestamp: fault.entry_timestamp,
        fixed_timestamp: fault.fixed_timestamp,
        type: fault.aton_fault_type,
        domain: fault.domain,
        state: fault.state,
        fixed: fault.fixed,
        aton_id: fault.aton_id,
        aton_name_fi: fault.aton_name_fi,
        aton_name_sv: fault.aton_name_sv,
        aton_type: fault.aton_type,
        fairway_number: fault.fairway_number,
        fairway_name_fi: fault.fairway_name_fi,
        fairway_name_sv: fault.fairway_name_sv,
        area_number: fault.area_number,
        area_description: fault.area_description
    };

    // convert geometry from db to geojson
    const geometry = Geometry.parse(Buffer.from(fault.geometry, "hex")).toGeoJSON();

    return {
        type: "Feature",
        properties: properties,
        geometry: <GeometryObject> geometry
    };
}

function validate(fault: any) {
    return fault.properties.FAULT_TYPE !== 'Kirjattu';
}