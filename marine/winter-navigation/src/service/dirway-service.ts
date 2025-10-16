import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as DirwayDB from "../db/dirways.js";
import type { DTDirway, DTDirwaypoint } from "../model/dt-apidata.js";
import type { Dirway, Dirwaypoint } from "../model/apidata.js";
import { groupBy } from "es-toolkit/compat";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
  Point,
} from "geojson";

export function getDirways(): Promise<[FeatureCollection, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const dirways = await DirwayDB.getDirways(db);
    const dirwaypoints = await DirwayDB.getDirwaypoints(db);
    const lastUpdated = new Date(); //await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);

    const featureCollection = convertToFeatureCollection(dirways, dirwaypoints);

    return [featureCollection, lastUpdated ?? undefined];
  });
}

function convertToFeatureCollection(
  dirways: Dirway[],
  dirwaypoints: Dirwaypoint[],
): FeatureCollection {
  const pointMap = groupBy(dirwaypoints, "dirway_id");

  const features = dirways
    .map((d) => convertToFeature(d, pointMap))
    .filter((f): f is Feature<LineString, GeoJsonProperties> =>
      f !== undefined
    );

  return {
    type: "FeatureCollection",
    features,
  };
}

function convertToFeature(
  dirway: Dirway,
  pointMap: Record<string, Dirwaypoint[]>,
): Feature<LineString> | Feature<Point> | undefined {
  const dbPoints = pointMap[dirway.id];

  if (!dbPoints) {
    return undefined;
  }

  let geometry: Point | LineString;

  // A valid LineString requires at least two points.
  if (dbPoints.length < 2 && dbPoints[0]?.longitude && dbPoints[0]?.latitude) {
    geometry = {
      type: "Point",
      coordinates: [dbPoints[0]?.longitude, dbPoints[0]?.latitude],
    };
  } else {
    const sortedPoints = dbPoints.sort((a, b) => a.order_num - b.order_num);
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
