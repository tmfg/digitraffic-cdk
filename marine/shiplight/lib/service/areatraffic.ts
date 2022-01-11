import {DTDatabase, inDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import * as AreaTrafficDb from '../db/areatraffic';
import {DbAreaTraffic} from '../db/areatraffic';
import {AreaTraffic} from "../model/areatraffic";

export async function updateAreaTrafficSendTime(areaId: number) {
    return inDatabase(async (db: DTDatabase) => {
        console.info("updating area %d", areaId);
        return AreaTrafficDb.updateAreaTrafficSendTime(db, areaId);
    });
}

const BRIGHTEN_OVERLAP_INTERVAL_MILLIS = 60 * 1000; // one minute

export function getAreaTraffic(): Promise<AreaTraffic[]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const areas = await AreaTrafficDb.getAreaTraffic(db);

        console.info("method=getAreaTraffic count=%d", areas.length);

        areas.forEach(area => console.info("method=getAreaTraffic sourceId=%d", area.id));

        return areas
            .filter(needToBrighten)
            .map(area => ({
                areaId: area.id,
                durationInMinutes: area.brighten_duration_min,
                visibilityInMeters: null,
            }));
    });
}

export function needToBrighten(area: DbAreaTraffic): boolean {
    // if lights have never been brightened or brightening has already ended(calculated with a bit of overlap)
    return area.brighten_end == null || isEndTimeBeforeNow(area.brighten_end.getTime());
}

function isEndTimeBeforeNow(endTime: number): boolean {
    return endTime < (Date.now() + BRIGHTEN_OVERLAP_INTERVAL_MILLIS);
}