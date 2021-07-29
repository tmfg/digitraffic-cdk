import {IDatabase} from "pg-promise";
import {inDatabase} from "digitraffic-common/postgres/database";
import * as AreaTrafficDb from '../db/areatraffic';
import {AreaTraffic} from "../model/areatraffic";

export function getAreaTraffic(): Promise<AreaTraffic[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return AreaTrafficDb.getAreaTraffic(db);
    });
}
