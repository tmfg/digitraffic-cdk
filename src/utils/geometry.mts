/**
 * GeoJSON functions and tools
 */
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import * as geoJsonValidator from "geojson-validation";
import { logger } from "../aws/runtime/dt-logger-default.mjs";

export const SRID_WGS84 = 4326;

/**
 * Creates WKT geometry from GeoJSON geometry
 * @param geometry GeoJson geometry to convert to WKT
 */
export function createGeometry(geometry: Geometry): string {
    if (geometry.type === "LineString") {
        const coordinates = linestring(geometry.coordinates);

        return `LINESTRING(${coordinates})`;
    } else if (geometry.type === "Point") {
        const coordinates = coordinatePair(geometry.coordinates);

        return `POINT(${coordinates})`;
    } else if (geometry.type === "Polygon") {
        const coordinates = polygon(geometry.coordinates);

        return `POLYGON(${coordinates})`;
    } else if (geometry.type === "MultiPolygon") {
        const coordinates = multiPolygon(geometry.coordinates);

        return `MULTIPOLYGON(${coordinates})`;
    }

    logger.error({
        method: "Geometry.createGeometry",
        message: "Unsupported locationType " + geometry.type,
    });

    return "POLYGON EMPTY";
}

function linestring(coordinates: Position[]): string {
    return coordinates.map((c: Position) => coordinatePair(c)).join(",");
}

function polygon(coordinates: Position[][]): string {
    const list = coordinates.map((c: Position[]) => linestring(c)).join(",");
    return `(${list})`;
}

function multiPolygon(coordinates: Position[][][]): string {
    const list = coordinates.map((c: Position[][]) => polygon(c)).join(",");
    return `(${list})`;
}

function coordinatePair(coordinate: Position): string {
    return `${coordinate[0]} ${coordinate[1]}`;
}

/**
 * Create a GeoJSON FeatureCollection from a list of GeoJSON features with a 'last updated' property
 * @param features List of Features
 * @param lastUpdated Last updated date
 */
export function createFeatureCollection(features: Feature[], lastUpdated: Date | null): FeatureCollection {
    return {
        type: "FeatureCollection",
        lastUpdated: lastUpdated,
        features: features,
    } as FeatureCollection;
}

export function isValidGeoJson<T>(json: T): boolean {
    // Tests complain about this method returning type string[] which is obviously wrong. Therefore, this casting.
    return geoJsonValidator.valid(json) as unknown as boolean;
}

export function isFeatureCollection<T>(json: T): boolean {
    // Tests complain about this method returning type string[] which is obviously wrong. Therefore, this casting.
    return geoJsonValidator.isFeatureCollection(json) as unknown as boolean;
}

const DEGREES_TO_RADIANS = 0.017453292519943295; // = Math.PI / 180
const EARTH_RADIUS_KM = 6371;

/**
 * Returns the distance between two WGS84 points in kilometers. Doesn't take in account altitude.
 * Based on the following Stack Overflow question:
 * http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula,
 * which is based on https://en.wikipedia.org/wiki/Haversine_formula (error rate: ~0.55%).
 * @param fromXLon first point longitude
 * @param fromYLat first point latitude
 * @param toXLon second point longitude
 * @param toYLat second point latitude
 */
function distanceBetweenWGS84PointsInKm(
    fromXLon: number,
    fromYLat: number,
    toXLon: number,
    toYLat: number
): number {
    const diffLat = toRadians(toYLat - fromYLat);
    const diffLon = toRadians(toXLon - fromXLon);

    const a =
        Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
        Math.cos(toRadians(fromYLat)) *
            Math.cos(toRadians(toYLat)) *
            Math.sin(diffLon / 2) *
            Math.sin(diffLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Returns the distance between two WGS84 GeoJSON positions in kilometers. Doesn't take in account altitude.
 * Based on the following Stack Overflow question:
 * http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula,
 * which is based on https://en.wikipedia.org/wiki/Haversine_formula (error rate: ~0.55%).
 * @param pos1 first position
 * @param pos2 second position
 */
export function distanceBetweenPositionsInKm(pos1: Position, pos2: Position) {
    if (pos1.length < 2 || pos1.length > 3 || pos2.length < 2 || pos2.length > 3) {
        throw Error(
            `Illegal Positions ${pos1.toString()} and ${pos2.toString()}. Both must have length between 2 or 3.`
        );
    }
    return distanceBetweenWGS84PointsInKm(pos1[0]!, pos1[1]!, pos2[0]!, pos2[1]!);
}

export function areDistinctPositions(previous: Position, next: Position) {
    return previous[0] !== next[0] || previous[1] !== next[1];
}

/**
 * Calculates distance between two GeoJSON points (WGS84)
 * @param pos1
 * @param pos2
 */
export function distanceBetweenPositionsInM(pos1: Position, pos2: Position) {
    return distanceBetweenPositionsInKm(pos1, pos2) * 1000; // km -> m
}

export function createGmlLineString(geometry: Geometry, srsName = "EPSG:4326") {
    const posList = createPosList(geometry);

    return {
        srsName,
        posList,
    };
}

function createPosList(geometry: Geometry) {
    if (geometry.type === "Point") {
        return positionToList(geometry.coordinates);
    } else if (geometry.type === "LineString") {
        return lineStringToList(geometry.coordinates);
    } else if (geometry.type === "Polygon") {
        return polygonToList(geometry.coordinates);
    }

    throw new Error("unknown geometry type " + JSON.stringify(geometry));
}

function polygonToList(positions: Position[][], precision = 8) {
    return positions.map((p) => lineStringToList(p, precision)).join(" ");
}

function lineStringToList(positions: Position[], precision = 8) {
    return positions.map((p) => positionToList(p, precision)).join(" ");
}

export function positionToList(position: Position, precision = 8) {
    return position.map((n) => n.toPrecision(precision)).join(" ");
}

// Converts numeric degrees to radians
function toRadians(angdeg: number) {
    return angdeg * DEGREES_TO_RADIANS;
}
