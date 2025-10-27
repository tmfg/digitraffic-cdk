import { z } from "zod";

import {
  FeatureCollectionSchema,
  FeatureSchema,
  GeometrySchema,
  PointSchema,
} from "@digitraffic/common/dist/types/geojson";

// dirways
export const DirwaySchema = z.object({
  name: z.string(),
  description: z.string(),
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

//locations
export const RestrictionSchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
  textCompilation: z.string(),
});

export const SuspensionSchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
  prenotification: z.boolean(),
  portsClosed: z.boolean(),
  dueTo: z.string(),
  specifications: z.string().optional(),
});

export const LocationSchema = z.object({
  name: z.string(),
  type: z.string(),
  locodeList: z.string(),
  nationality: z.string(),
  winterport: z.boolean(),
  restrictions: z.array(RestrictionSchema).optional(),
  suspensions: z.array(SuspensionSchema).optional(),
});

export const LocationFeatureSchema = FeatureSchema.extend({
  properties: LocationSchema,
  geometry: PointSchema,
});

export const LocationFeatureCollectionSchema = FeatureCollectionSchema.extend({
  features: z.array(LocationFeatureSchema),
});

export type Suspension = z.infer<typeof SuspensionSchema>;
export type Restriction = z.infer<typeof RestrictionSchema>;
export type LocationFeature = z.infer<typeof LocationFeatureSchema>;
export type LocationFeatureCollection = z.infer<
  typeof LocationFeatureCollectionSchema
>;

// vessels
export const AssistanceReceivedVesselSchema = z.object({
  assistingVessel: z.object({
    imo: z.number().optional(),
    mmsi: z.number().optional(),
    name: z.string(),
  }),
});

export const AssistanceGivenVesselSchema = z.object({
  assistedVessel: z.object({
    imo: z.number().optional(),
    mmsi: z.number().optional(),
    name: z.string(),
  }),
});

export const BasePlannedAssistanceSchema = z.object({
  queuePosition: z.number(),
  startTime: z.date(),
  endTime: z.date().optional(),
});

export const AssistanceReceivedSchema = BasePlannedAssistanceSchema.extend(
  AssistanceReceivedVesselSchema.shape,
);
export const AssistanceGivenSchema = BasePlannedAssistanceSchema.extend(
  AssistanceGivenVesselSchema.shape,
);

export const PlannedAssistanceSchema = z.union([
  AssistanceReceivedSchema,
  AssistanceGivenSchema,
]);

export const BaseActivitySchema = z.object({
  type: z.string(),
  reason: z.string().optional(),
  publicComment: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
});

export const ActivitySchema = z.union([
  BaseActivitySchema.extend(AssistanceReceivedVesselSchema.shape),
  BaseActivitySchema.extend(AssistanceGivenVesselSchema.shape),
  BaseActivitySchema,
]);

export const VesselSchema = z.object({
  name: z.string(),
  callSign: z.string().optional(),
  shortcode: z.string().optional(),
  imo: z.number().optional(),
  mmsi: z.number().optional(),
  type: z.string().optional(),
  activities: z.array(ActivitySchema).optional(),
  plannedAssistances: z.array(PlannedAssistanceSchema).optional(),
});

export type Vessel = z.infer<typeof VesselSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type PlannedAssistance = z.infer<typeof PlannedAssistanceSchema>;
export type AssistanceGiven = z.infer<typeof AssistanceGivenSchema>;
export type AssistanceReceived = z.infer<typeof AssistanceReceivedSchema>;
