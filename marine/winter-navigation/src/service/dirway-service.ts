import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as DirwayDB from "../db/dirways.js";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { DirwayWithPoints } from "../model/db-models.js";
import type { DirwayFeatureCollection, DTDirway } from "../model/dt-apidata.js";

export function getDirways(): Promise<[FeatureCollection, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const dirways = await DirwayDB.getDirways(db);
    const lastUpdated = new Date(); //await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);
    const featureCollection = convertToFeatureCollection(dirways);

    return [featureCollection, lastUpdated ?? undefined];
  });
}

function convertToFeatureCollection(
  dirways: DirwayWithPoints[],
): DirwayFeatureCollection {
  const features = dirways
    .map((d) => convertToFeature(d))
    .filter((f): f is Feature<LineString, DTDirway> => f !== undefined);

  return {
    type: "FeatureCollection",
    features,
  };
}

function convertToFeature(
  dirway: DirwayWithPoints,
): Feature<LineString> | Feature<Point> | undefined {
  const points = dirway.dirwaypoints;

  if (!points || points.length === 0) {
    return undefined;
  }

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
