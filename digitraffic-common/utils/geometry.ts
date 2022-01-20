import {Feature, FeatureCollection, Geometry, Position} from "geojson";
import * as Assert from "../test/asserter";

export function createGeometry(geometry: Geometry): string {
    if (geometry.type === 'LineString') {
        const coordinates = linestring(geometry.coordinates);

        return `LINESTRING(${coordinates})`;
    } else if (geometry.type === 'Point') {
        const coordinates = coordinatePair(geometry.coordinates);

        return `POINT(${coordinates})`;
    } else if (geometry.type === 'Polygon') {
        const coordinates = polygon(geometry.coordinates);

        return `POLYGON(${coordinates})`;
    } else if (geometry.type === 'MultiPolygon') {
        const coordinates = multiPolygon(geometry.coordinates);

        return `MULTIPOLYGON(${coordinates})`;
    }

    console.error("unsupported locationType=%s", geometry.type);
    return "POLYGON EMPTY";
}

function linestring(coordinates: Position[]): string {
    return coordinates.map((c: Position) =>  coordinatePair(c)).join(',');
}

function polygon(coordinates: Position[][]):string {
    const list = coordinates.map((c: Position[]) => linestring(c)).join(',');
    return `(${list})`;
}

function multiPolygon(coordinates: Position[][][]):string {
    const list = coordinates.map((c: Position[][]) => polygon(c)).join(',');
    return `(${list})`;
}

function coordinatePair(coordinate: Position): string {
    return `${coordinate[0]} ${coordinate[1]}`;
}

/**
 * Create a FeatureCollection from a list of features with a 'last updated' property
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const geoJsonValidator = require('geojson-validation');

export function isValidGeoJson<T>(json: T): boolean {
    return geoJsonValidator.valid(json);
}

export function isFeatureCollection<T>(json: T): boolean {
    return geoJsonValidator.isFeatureCollection(json);
}