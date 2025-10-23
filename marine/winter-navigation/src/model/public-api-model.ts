import type { Feature, FeatureCollection, Geometry } from "geojson";
import { z } from "zod";

import {
  FeatureCollectionSchema,
  FeatureSchema,
  GeometrySchema,
  PointSchema,
} from "@digitraffic/common/dist/types/geojson";

export const DirwaySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const DirwayPointResponseSchema = z.object({
  orderNum: z.number(),
  name: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export const DirwayFeatureSchema = FeatureSchema.extend({
  properties: DirwaySchema,
  geometry: GeometrySchema,
});

export const DirwayFeatureCollectionSchema = FeatureCollectionSchema.extend({
  features: z.array(DirwayFeatureSchema),
});
export type DirwayFeatureCollection = z.infer<
  typeof DirwayFeatureCollectionSchema
>;
export type DirwayFeature = z.infer<typeof DirwayFeatureSchema>;
