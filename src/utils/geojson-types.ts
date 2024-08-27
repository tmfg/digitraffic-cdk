/**
 * GeoJSON types
 */
import type { LineString, Point, Position } from "geojson";

export class GeoJsonPoint implements Point {
    readonly type: "Point" = "Point";
    readonly coordinates: Position;

    constructor(coordinates: Position) {
        this.coordinates = coordinates;
    }
}

export class GeoJsonLineString implements LineString {
    readonly type: "LineString" = "LineString";
    readonly coordinates: Position[];

    constructor(coordinates: Position[]) {
        this.coordinates = coordinates;
    }
}
