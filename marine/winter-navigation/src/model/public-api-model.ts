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
}).describe(
  "Dirways are paths published by icebreakers to help coordinate the movement of vessel through the ice.",
);

export const DirwayFeatureSchema = FeatureSchema.omit({ id: true }).extend({
  properties: DirwaySchema,
  geometry: GeometrySchema,
}).describe("GeoJSON Feature");

export const DirwayFeatureCollectionSchema = FeatureCollectionSchema.extend({
  features: z.array(DirwayFeatureSchema),
}).describe("GeoJSON FeatureCollection");

export type DirwayFeatureCollection = z.infer<
  typeof DirwayFeatureCollectionSchema
>;
export type DirwayFeature = z.infer<typeof DirwayFeatureSchema>;

//locations
export const RestrictionSchema = z.object({
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  textCompilation: z.string().describe(
    "Textual presentation of the restriction.",
  ),
}).describe(
  "Assistance restrictions are restrictions published by authorities that target a specific location for a range of time.",
);

export const SuspensionSchema = z.object({
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  prenotification: z.boolean().describe(
    "Whether suspension is announced to users before it starts.",
  ),
  portsClosed: z.boolean().describe(
    "Bit indicating whether the port is closed to all operations entirely.",
  ),
  dueTo: z.string().describe("Main reason for port suspension."),
  specifications: z.string().optional().describe(
    "More specific reason for port suspension. ",
  ),
}).describe("Information on port suspensions.");

export const LocationSchema = z.object({
  name: z.string(),
  type: z.string().describe(
    "Type of location. PORT or FAIRWAY, but there could be more in the future.",
  ),
  locodeList: z.string().describe("Comma separated list of UN locodes."),
  nationality: z.string(),
  winterport: z.boolean().describe(
    "Boolean indicating whether a port is a winterport or not.",
  ),
  restrictions: z.array(RestrictionSchema).optional(),
  suspensions: z.array(SuspensionSchema).optional(),
}).describe(
  "Locations are points of interest on a map, usually ports, that can have restrictions placed on them.",
);

export const LocationFeatureSchema = FeatureSchema.omit({ id: true }).extend({
  properties: LocationSchema,
  geometry: PointSchema,
}).describe("GeoJSON Feature");

export const LocationFeatureCollectionSchema = FeatureCollectionSchema.extend({
  features: z.array(LocationFeatureSchema),
}).describe("GeoJSON FeatureCollection");

// vessels
export const AssistanceReceivedVesselSchema = z.object({
  assistingVessel: z.object({
    imo: z.number().optional(),
    mmsi: z.number().optional(),
    name: z.string(),
  }).describe("Vessel that is assisting"),
});

export const AssistanceGivenVesselSchema = z.object({
  assistedVessel: z.object({
    imo: z.number().optional(),
    mmsi: z.number().optional(),
    name: z.string(),
  }).describe("Vessel that is being assisted"),
});

export const BasePlannedAssistanceSchema = z.object({
  queuePosition: z.number().describe(
    "Order number of this assistance in the icebreaker's queue of planned assistances",
  ),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
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
  type: z.string().describe(
    "Current list of types (subject to change): CREWA (Actual crew change), LED (Lead), LOC (Local Icebreaking), MOVE (Move), ORDER (Order), OUT (Out of Operation), CREWP (Planned crew change), STOP (Stop), TOW (Tow), TRANS (Transfer), WAIT (Wait)\n\n" +
      "Activities that affect vessels subject to icebreaker assistance:\n" +
      "- WAIT: vessel is waiting for icebreaker assistance\n" +
      "- STOP: vessel is waiting for other reason\n\n" +
      "Activities that affect icebreakers:\n" +
      "- STOP, LOC, MOVE, TRANS\n\n" +
      "Activities that affect both vessel and icebreaker:\n" +
      "- LED, TOW",
  ),
  reason: z.string().optional().describe("Optional reason for activity"),
  publicComment: z.string().optional().describe(
    "Optional publicly available specification for activity.",
  ),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
});

export const ActivitySchema = z.union([
  BaseActivitySchema.extend(AssistanceReceivedVesselSchema.shape),
  BaseActivitySchema.extend(AssistanceGivenVesselSchema.shape),
  BaseActivitySchema,
]);

export const VesselSchema = z.object({
  name: z.string(),
  callSign: z.string().optional().describe("VHF callsign"),
  shortcode: z.string().optional().describe(
    "Three letter code for vessel. Not unique, but might be useful to differentiate between vessels where space is limited.",
  ),
  imo: z.number().optional(),
  mmsi: z.number().optional(),
  type: z.string().optional().describe(
    "Vessel type. Current list of types (subject to change): Barge, Bulk Cargo, Container Cargo, General Cargo, Icebreaker, Other vessel, Passenger Ship, Pusher, Pusher+Barge, Refridgerated Cargo, River Tonnage, Roro Cargo, Supply Ship, Tanker, Tug, Tug+Barge, Vehicle Carrier",
  ),
  activities: z.array(ActivitySchema).optional().describe(
    "A list of all activities related to this vessel.",
  ),
  plannedAssistances: z.array(PlannedAssistanceSchema).optional().describe(
    "Planned assistances where the vessel is either the icebreaker or the one being assisted.",
  ),
  lastUpdated: z.iso.datetime().optional(),
});

export const VesselsResponseSchema = z.object({
  lastUpdated: z.iso.datetime().optional(),
  vessels: z.array(VesselSchema),
});

export type Vessel = z.infer<typeof VesselSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type PlannedAssistance = z.infer<typeof PlannedAssistanceSchema>;
export type AssistanceGiven = z.infer<typeof AssistanceGivenSchema>;
export type AssistanceReceived = z.infer<typeof AssistanceReceivedSchema>;
export type AssistanceReceivedVessel = z.infer<
  typeof AssistanceReceivedVesselSchema
>;
export type AssistanceGivenVessel = z.infer<typeof AssistanceGivenVesselSchema>;
export type Suspension = z.infer<typeof SuspensionSchema>;
export type Restriction = z.infer<typeof RestrictionSchema>;
export type LocationFeature = z.infer<typeof LocationFeatureSchema>;
export type LocationFeatureCollection = z.infer<
  typeof LocationFeatureCollectionSchema
>;
export type VesselsResponse = z.infer<typeof VesselsResponseSchema>;

export function isAssistanceReceived(
  a: PlannedAssistance | Activity,
): a is AssistanceReceived | (Activity & AssistanceReceivedVessel) {
  return "assistingVessel" in a;
}

export function isAssistanceGiven(
  a: PlannedAssistance | Activity,
): a is AssistanceGiven | (Activity & AssistanceGivenVessel) {
  return "assistedVessel" in a;
}
