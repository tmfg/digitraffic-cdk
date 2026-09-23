import { z } from "zod";

export const CoordinatesSchema = z.array(z.number()).min(2).max(3);

export const PointSchema = z.object({
  type: z.literal("Point"),
  coordinates: CoordinatesSchema,
});

export const MultiPointSchema = z.object({
  type: z.literal("MultiPoint"),
  coordinates: z.array(CoordinatesSchema),
});

export const LineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(CoordinatesSchema).min(2),
});

export const MultiLineStringSchema = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(CoordinatesSchema).min(2)),
});

export const PolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(CoordinatesSchema).min(4)),
});

export const MultiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(CoordinatesSchema).min(4))),
});

export type Point = z.infer<typeof PointSchema>;

export type Geometry =
  | z.infer<typeof PointSchema>
  | z.infer<typeof MultiPointSchema>
  | z.infer<typeof LineStringSchema>
  | z.infer<typeof MultiLineStringSchema>
  | z.infer<typeof PolygonSchema>
  | z.infer<typeof MultiPolygonSchema>
  | {
      type: "GeometryCollection";
      geometries: Geometry[];
    };

// --- Recursive GeometrySchema ---
export const GeometrySchema: z.ZodType<Geometry> = z.lazy(() =>
  z.union([
    PointSchema,
    MultiPointSchema,
    LineStringSchema,
    MultiLineStringSchema,
    PolygonSchema,
    MultiPolygonSchema,
    // GeometryCollection is recursive, so we need to use z.lazy
    z.object({
      type: z.literal("GeometryCollection"),
      geometries: z.array(GeometrySchema),
    }),
  ]),
);

export const FeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: GeometrySchema,
  properties: z.record(z.string(), z.any()).optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

export const FeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(FeatureSchema),
});
