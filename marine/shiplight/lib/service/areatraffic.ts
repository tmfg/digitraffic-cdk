import {IDatabase} from "pg-promise";
import {inDatabase} from "digitraffic-common/postgres/database";
import * as AreaTrafficDb from '../db/areatraffic';
import {AreaTraffic} from "../model/areatraffic";

export function getAreaTraffic(): Promise<AreaTraffic[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        const areas: Promise<AreaTraffic[]> = AreaTrafficDb.getAreaTraffic(db).then(areas => areas.map(a => ({
            areaId: a.id,
            durationInMinutes: a.lighting_duration_min
        })));
        return areas;
    });
}
