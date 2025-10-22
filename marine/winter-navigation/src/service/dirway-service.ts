import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as DirwayDB from "../db/dirways.js";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { DirwayWithPoints } from "../model/db-models.js";
import { createFeatureCollection } from "@digitraffic/common/dist/utils/geometry";

export const DIRWAYS_CHECK = "WN_DIRWAY_CHECK";

export function getDirways(): Promise<[FeatureCollection, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const dirways = await DirwayDB.getDirways(db);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      DIRWAYS_CHECK,
    );
    const featureCollection = createFeatureCollection(
      dirways.map(convertToFeature),
      lastUpdated,
    );

    return [featureCollection, lastUpdated ?? undefined];
  });
}

function convertToFeature(
  dirway: DirwayWithPoints,
): Feature<LineString> | Feature<Point> {
  const points = dirway.dirwaypoints;

  let geometry: Point | LineString;

  // A valid LineString requires at least two points
  if (points.length === 1 && points[0]) {
    geometry = {
      type: "Point",
      coordinates: [points[0].longitude, points[0].latitude],
    };
  } else {
    const sortedPoints = points.sort((a, b) => a.order_num - b.order_num);
    const coordinates = sortedPoints.map((p) => [p.longitude, p.latitude]);
    geometry = {
      type: "LineString",
      coordinates,
    };
  }

  return {
    type: "Feature",
    id: dirway.id,
    properties: {
      name: dirway.name,
      description: dirway.description,
    },
    geometry,
  } as Feature<Point> | Feature<LineString>;
}
