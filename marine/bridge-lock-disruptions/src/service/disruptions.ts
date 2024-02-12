import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import {
    type DTDatabase,
    type DTTransaction,
    inDatabaseReadonly,
    inTransaction
} from "@digitraffic/common/dist/database/database";
import type { Feature, FeatureCollection, GeoJSON, Geometry as GeoJSONGeometry } from "geojson";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { Disruption, SpatialDisruption } from "../model/disruption.js";
import * as DisruptionsApi from "../api/disruptions.js";
import { createFeatureCollection, isValidGeoJson } from "@digitraffic/common/dist/utils/geometry";
import type { DisruptionFeature } from "../api/disruptions.js";
import { Geometry } from "wkx";
import { parse } from "date-fns";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";
import { type DbDisruption, deleteAllButDisruptions, findAll, updateDisruptions } from "../db/disruptions.js";

export const DISRUPTIONS_DATE_FORMAT = "d.M.yyyy H:mm" as const;

export const BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE = "BRIDGE_LOCK_DISRUPTIONS" as const;
export const BRIDGE_LOCK_DISRUPTIONS_CHECK = "BRIDGE_LOCK_DISRUPTIONS_CHECK" as const;

export function findAllDisruptions(): Promise<[FeatureCollection, Date]> {
    const start = Date.now();
    return inDatabaseReadonly(async (db: DTDatabase): Promise<[FeatureCollection, Date]> => {
        const disruptions = await findAll(db);
        const disruptionsFeatures = disruptions.map(convertFeature);
        const lastUpdated =
            (await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE)) ?? EPOCH;

        return [createFeatureCollection(disruptionsFeatures, lastUpdated), lastUpdated];
    }).finally(() => {
        logger.info({
            method: "DisruptionsService.findAllDisruptions",
            tookMs: Date.now() - start
        });
    });
}

export async function saveDisruptions(disruptions: SpatialDisruption[]): Promise<void> {
    const start = Date.now();
    let deletedCount = 0;
    let updatedCount = 0;

    await inTransaction(async (tx: DTTransaction) => {
        deletedCount = await deleteAllButDisruptions(
            tx,
            disruptions.map((d) => d.Id)
        );

        updatedCount = (await tx.batch(updateDisruptions(tx, disruptions.reverse()))).reduce(
            (sum, c) => sum + c,
            0
        );

        const updatedTimestampUpdates = [
            LastUpdatedDB.updateUpdatedTimestamp(tx, BRIDGE_LOCK_DISRUPTIONS_CHECK, new Date(start))
        ];

        // update timestamp only if new distributions are added/modified/deleted
        if (deletedCount > 0 || updatedCount > 0) {
            updatedTimestampUpdates.push(
                LastUpdatedDB.updateUpdatedTimestamp(tx, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE, new Date(start))
            );
        }

        return tx.batch(updatedTimestampUpdates);
    }).finally(() => {
        logger.info({
            method: "DisruptionsService.saveDisruptions",
            customCount: disruptions.length,
            customUpdatedCount: updatedCount,
            customDeletedCount: deletedCount,
            tookMs: Date.now() - start
        });
    });
}

export async function fetchRemoteDisruptions(endpointUrl: string): Promise<SpatialDisruption[]> {
    const disruptions = await DisruptionsApi.getDisruptions(endpointUrl);
    const validDisruptions = disruptions.filter(validateGeoJson);
    return validDisruptions.map(featureToDisruption);
}

export function featureToDisruption(feature: DisruptionFeature): SpatialDisruption {
    const props = feature.properties;

    return {
        Id: props.Id,
        Type_Id: props.Type_Id,
        StartDate: normalizeDisruptionDate(props.StartDate),
        EndDate: normalizeDisruptionDate(props.EndDate),
        DescriptionFi: props.DescriptionFi,
        DescriptionSv: props.DescriptionSv,
        DescriptionEn: props.DescriptionEn,
        geometry: feature.geometry
    };
}

export function normalizeDisruptionDate(dateStr: string): Date {
    return parse(dateStr, DISRUPTIONS_DATE_FORMAT, new Date());
}

export function validateGeoJson(geoJson: GeoJSON): boolean {
    try {
        return isValidGeoJson(geoJson);
    } catch (e) {
        logger.warn({
            method: "DisruptionsService.validateGeoJson",
            message: "invalid GeoJSON"
        });

        logger.debug(geoJson);

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
        DescriptionEn: disruption.description_en
    };
    // convert geometry from wkb to geojson
    const geometry = Geometry.parse(Buffer.from(disruption.geometry, "hex")).toGeoJSON() as GeoJSONGeometry;
    return {
        type: "Feature",
        properties,
        geometry
    };
}
