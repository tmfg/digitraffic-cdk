import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";

export function createFeatureCollection<
  G extends Geometry | null,
  P extends GeoJsonProperties,
>(
  features: Feature<G, P>[],
  // eslint-disable-next-line @rushstack/no-new-null
  lastUpdated: Date | null,
  // eslint-disable-next-line @rushstack/no-new-null
): FeatureCollection<G, P> & { lastUpdated: Date | null } {
  return {
    type: "FeatureCollection",
    lastUpdated: lastUpdated,
    features: features,
  };
}
