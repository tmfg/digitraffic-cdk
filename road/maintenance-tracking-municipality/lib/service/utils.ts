import crypto from "crypto";
import {DbMaintenanceTracking} from "../model/db-data";
import {Position} from "geojson";

export function dateFromIsoString(isoString: string): Date {
    return new Date(isoString);
}

export function dateFromIsoStringOptional(isoString?: string): Date|undefined {
    if (!isoString) {
        return undefined;
    }
    return new Date(isoString);
}


/**
 * Creates bigint hash value from given string
 * @param src
 */
export function createHarjaId(src: string): bigint {
    const hex = crypto.createHash("sha256").update(src).digest("hex");
    // Postgres BigInt is 8 byte signed -> take first 7 1/2 bytes to be safe side for unsigned hex value
    return BigInt('0x' + hex.substring(0, 15)).valueOf();
}

export function countEstimatedSizeOfMessage(message: object|string) {
    if (!message) {
        return 0;
    }
    try {
        // Just estimate of the size of data
        return Buffer.byteLength(typeof message === 'string' ? message : JSON.stringify(message));
    } catch (e) {
        console.error(`method=utils.countEstimatedSizeOfMessage`, e);
    }
    return 0;
}

export function hasBothStringArraysSameValues(a: string[], b: string[]): boolean {
    if ((a && !b) || (!a && b)) {
        return false;
    } else if (!a && !b) {
        return true;
    }
    const aSet = new Set(a);
    const bSet = new Set(b);
    if (aSet.size !== bSet.size) {
        return false;
    }
    return Array.from(aSet).every(value => bSet.has(value));
}

const DIVIDER_FOR_MS_TO_HOURS = 1000*60.0*60.0;

export function calculateSpeedInKmH(distanceKm:number, diffMs:number): number {
    const hours = diffMs / DIVIDER_FOR_MS_TO_HOURS;
    const speed = distanceKm / hours;
    return Number.isNaN(speed) ? 0 : speed;
}

export function countDiffMs(previous: Date, next: Date): number {
    return next.getTime() - previous.getTime();
}

export function getTrackingStartPoint(tracking: DbMaintenanceTracking): Position {
    if (tracking.line_string && tracking.line_string.coordinates.length) {
        return tracking.line_string.coordinates[0];
    }
    return tracking.last_point.coordinates;
}
