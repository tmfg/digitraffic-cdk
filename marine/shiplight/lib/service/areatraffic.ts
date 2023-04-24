import { DTDatabase, inDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as AreaTrafficDb from "../db/areatraffic";
import { DbAreaTraffic } from "../db/areatraffic";
import { AreaTraffic } from "../model/areatraffic";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function updateAreaTrafficSendTime(areaId: number) {
    return inDatabase((db: DTDatabase) => {
        logger.info({
            method: "AreatrafficService.updateAreaTrafficSendTime",
            message: `updating area ${areaId}`
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
            count: areas.length
        });

        areas.forEach((area) => {
            logger.info({
                method: "AreatrafficService.getAreaTraffic",
                message: `sourceId ${area.id}`
            });
        });

        return areas.filter(needToBrighten).map((area) => ({
            areaId: area.id,
            durationInMinutes: area.brighten_duration_min,
            visibilityInMeters: null
        }));
    });
}

export function needToBrighten(area: DbAreaTraffic): boolean {
    // if lights have never been brightened or brightening has already ended(calculated with a bit of overlap)
    return area.brighten_end == null || isEndTimeBeforeNow(area.brighten_end.getTime());
}

function isEndTimeBeforeNow(endTime: number): boolean {
    return endTime < Date.now() + BRIGHTEN_OVERLAP_INTERVAL_MILLIS;
}
