import {IDatabase} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {getStartTime} from "../timeutil";

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTime(time);

    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await ShiplistDB.findByLocode(db, startTime, locode);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}
