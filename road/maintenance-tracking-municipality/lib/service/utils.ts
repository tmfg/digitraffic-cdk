import crypto from "crypto";
import { Position } from "geojson";
import { DbMaintenanceTracking } from "../model/db-data";
import { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";

/**
 * Creates bigint hash value from given string
 * @param src
 */
export function createHarjaId(src: string): bigint {
    const hex = crypto.createHash("sha256").update(src).digest("hex");
    // Postgres BigInt is 8 byte signed -> take first 7 1/2 bytes to be safe side for unsigned hex value
    return BigInt("0x" + hex.substring(0, 15)).valueOf();
}

export function countEstimatedSizeOfMessage(message: string | object): number {
    if (message) {
        try {
            // Just estimate of the size of data
            return Buffer.byteLength(
                typeof message === "string" ? message : JSON.stringify(message)
            );
        } catch (e) {
            console.error(`method=utils.countEstimatedSizeOfMessage`, e);
        }
    }
    return 0;
}

const MULTIPLIER_FROM_M_S_TO_KM_H = 3.6;

/**
 * Calculates speed in km/h. Can return NaN or Infinity.
 * @param distanceM distance in meters
 * @param timeS time in seconds
 */
export function calculateSpeedInKmH(distanceM: number, timeS: number): number {
    return calculateSpeedInMS(distanceM, timeS) * MULTIPLIER_FROM_M_S_TO_KM_H;
}

/**
 * Calculates speed in m/s. Can return NaN or Infinity.
 * @param distanceM dinstance in meters
 * @param timeS time in seconds
 */
export function calculateSpeedInMS(distanceM: number, timeS: number): number {
    return distanceM / timeS;
}

export function getTrackingStartPoint(
    tracking: DbMaintenanceTracking
): Position {
    if (tracking.geometry instanceof GeoJsonPoint) {
        return tracking.geometry.coordinates;
    }
    return tracking.geometry.coordinates[0];
}

export function getTrackingEndPoint(tracking: DbMaintenanceTracking): Position {
    if (tracking.geometry instanceof GeoJsonPoint) {
        return tracking.geometry.coordinates;
    }
    return tracking.geometry.coordinates[
        tracking.geometry.coordinates.length - 1
    ];
}

export function convertSpeedKmHToMS(speedInKmH: number): number {
    return speedInKmH / 3.6;
}
