/**
 * GeoJSON types
 */
import {LineString, Point, Position} from "geojson";

export class GeoJsonPoint implements Point {
    readonly type = "Point";
    readonly coordinates: Position;

    constructor(coordinates: Position) {
        this.coordinates = coordinates;
    }
}

export class GeoJsonLineString implements LineString {
    readonly type = "LineString";
    readonly coordinates: Position[];

    constructor(coordinates: Position[]) {
        this.coordinates = coordinates;
    }
}