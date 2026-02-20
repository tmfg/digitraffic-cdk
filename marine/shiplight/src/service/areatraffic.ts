import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import type { DbAreaTraffic, DbAreaTrafficResult } from "../db/areatraffic.js";
import * as AreaTrafficDb from "../db/areatraffic.js";
import type { AreaTraffic } from "../model/areatraffic.js";

export async function updateAreaTrafficSendTime(
  areaId: number,
): Promise<unknown> {
  return inDatabase((db: DTDatabase) => {
    logger.info({
      method: "AreatrafficService.updateAreaTrafficSendTime",
      message: `updating area ${areaId}`,
    });
    return AreaTrafficDb.updateAreaTrafficSendTime(db, areaId);
  });
}

const BRIGHTEN_OVERLAP_INTERVAL_MILLIS = 60 * 1000; // one minute

export function getAreaTraffic(): Promise<AreaTraffic[]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const areas = await AreaTrafficDb.getAreaTraffic(db);

    logger.info({
      method: "AreatrafficService.getAreaTraffic",
      customCount: areas.length,
    });

    areas.forEach((area) => {
      logger.info({
        method: "AreatrafficService.getAreaTraffic",
        message: `sourceId ${area.id}`,
      });
    });

    return areas.filter(needToBrighten).map(dbAreaTrafficResultToAreaTraffic);
  });
}

export function needToBrighten(area: DbAreaTraffic): boolean {
  // if lights have never been brightened or brightening has already ended(calculated with a bit of overlap)
  return !area.brighten_end || isEndTimeBeforeNow(area.brighten_end.getTime());
}

function isEndTimeBeforeNow(endTime: number): boolean {
  return endTime < Date.now() + BRIGHTEN_OVERLAP_INTERVAL_MILLIS;
}

function dbAreaTrafficResultToAreaTraffic(
  result: DbAreaTrafficResult,
): AreaTraffic {
  return {
    areaId: result.id,
    durationInMinutes: result.brighten_duration_min,
    visibilityInMeters: undefined,
    ship: {
      name: result.ship_name,
      mmsi: result.ship_mmsi,
    },
  };
}
