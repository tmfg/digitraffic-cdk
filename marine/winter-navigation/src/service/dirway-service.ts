import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as DirwayDB from "../db/dirways.js";
import type { DTDirway, DTDirwaypoint } from "../model/dt-apidata.js";
import type { Dirway, Dirwaypoint } from "../model/apidata.js";
import { groupBy } from "es-toolkit/compat";

export function getDirways(): Promise<[DTDirway[], Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const dirways = await DirwayDB.getDirways(db);
    const dirwaypoints = await DirwayDB.getDirwaypoints(db);
    const lastUpdated = new Date(); //await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);
    const dtDirways = convertDirways(dirways, dirwaypoints);

    return [dtDirways, lastUpdated ?? undefined];
  });
}

function convertDirways(
  dirways: Dirway[],
  dirwaypoints: Dirwaypoint[],
): DTDirway[] {
  const pointMap = groupBy(dirwaypoints, "dirway_id");

  return dirways.map((d) => convertDirway(d, pointMap));
}

function convertDirway(
  dirway: Dirway,
  pointMap: Record<string, Dirwaypoint[]>,
): DTDirway {
  const dbPoints = pointMap[dirway.id];

  const dirwaypoints = dbPoints ? convertDirwaypoints(dbPoints) : undefined;

  return {
    name: dirway.name,
    description: dirway.description,
    dirwaypoints,
  } satisfies DTDirway;
}

function convertDirwaypoints(dbPoints: Dirwaypoint[]): DTDirwaypoint[] {
  return dbPoints.map((p) => {
    return {
      orderNum: p.order_num,
      latitude: p.latitude,
      longitude: p.longitude,
    } satisfies DTDirwaypoint;
  });
}
