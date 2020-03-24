import {FeatureCollection,Feature,GeoJsonProperties} from "geojson";

export function createFeatureCollection(features: Feature[], lastUpdated: Date | null): FeatureCollection {
    return <FeatureCollection> {
        type: "FeatureCollection",
        lastUpdated: lastUpdated,
        features: features
    }
}
