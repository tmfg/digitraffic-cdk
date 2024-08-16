declare module "geojson-validation" {
    export function valid(json): boolean;
    export function isFeatureCollection(json): boolean;
}
