import {FeatureCollection,Feature} from "geojson";

/**
 * Create a FeatureCollection from a list of features with a 'last updated' property
 * @param features List of Features
 * @param lastUpdated Last updated date
 */
export function createFeatureCollection(features: Feature[], lastUpdated: Date | null): FeatureCollection {
    return {
        type: "FeatureCollection",
        lastUpdated: lastUpdated,
        features: features
    } as FeatureCollection;
}
