import {IDatabase} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {getStartTimeForShiplist} from "../timeutil";

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTimeForShiplist(time);
    
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await ShiplistDB.findByLocode(db, startTime, endTime, locode);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}
