import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import * as FaultsDB from "../db/faults";
import * as S124Converter from "./s124-converter";
import { DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { Geometry, LineString, Point } from "wkx";
import { Builder } from "xml2js";
import { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { Feature, FeatureCollection, GeometryObject } from "geojson";
import { createFeatureCollection } from "@digitraffic/common/dist/utils/geometry";
import { Language } from "@digitraffic/common/dist/types/language";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { DbFault } from "../model/fault";

export const ATON_FAULTS_CHECK = "ATON_FAULTS_CHECK";

export interface FaultProps {
    readonly id: number;
    readonly entry_timestamp: Date;
    readonly fixed_timestamp: Date | null;
    readonly type: string;
    readonly domain: string;
    readonly state: string;
    readonly fixed: boolean;
    readonly aton_id: number;
    readonly aton_name_fi: string;
    readonly aton_name_sv: string;
    readonly aton_type: string;
    readonly fairway_number: number;
    readonly fairway_name_fi: string;
    readonly fairway_name_sv: string;
    readonly area_number: number;
    readonly area_description: string;
}

export function findAllFaults(
    language: Language,
    fixedInHours: number
): Promise<[FeatureCollection, Date | null]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const features = await FaultsDB.findAll(db, language, fixedInHours, convertFeature);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, ATON_FAULTS_CHECK);

        return [createFeatureCollection(features, lastUpdated), lastUpdated];
    });
}

export async function getFaultS124ById(db: DTDatabase, faultId: number): Promise<string | null> {
    const start = Date.now();
    const fault = await FaultsDB.getFaultById(db, faultId);

    try {
        if (!fault) {
            return null;
        }

        return new Builder().buildObject(S124Converter.convertFault(fault));
    } finally {
        logger.info({
            method: "FaultsService.getFaultS124ById",
            tookMs: Date.now() - start
        });
    }
}

export async function findFaultIdsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<number[]> {
    const start = Date.now();
    const voyageLineString = new LineString(
        voyagePlan.route.waypoints
            .flatMap((w) => w.waypoint.flatMap((wp) => wp.position))
            .map((p) => new Point(p.$.lon, p.$.lat))
    );
    const faultIds = await inDatabaseReadonly((db: DTDatabase) => {
        return FaultsDB.findFaultIdsByRoute(db, voyageLineString);
    });
    logger.info({
        method: "FaultsService.findFaultIdsForVoyagePlan",
        tookMs: Date.now() - start,
        customCount: faultIds.length
    });
    return faultIds;
}

function convertFeature(fault: DbFault): Feature {
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
    const geometry = Geometry.parse(Buffer.from(fault.geometry, "hex")).toGeoJSON() as GeometryObject;

    return {
        type: "Feature",
        properties: properties,
        geometry
    };
}
