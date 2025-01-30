import type { Feature, FeatureCollection, Geometry } from "geojson";

export type WarningFeatureCollection = FeatureCollection<
  Geometry,
  WarningFeatureProperties
>;

export type WarningFeature = Feature<Geometry, WarningFeatureProperties>;

export interface WarningFeatureProperties {
  readonly id: number;
  readonly creationTime: string | number;
  readonly state: string;

  readonly areasEn: string;
  readonly typeEn: string;
  readonly contentsEn: string;

  readonly validityStartTime: string | number;
  readonly validityEndTime: string | number | undefined;
}
