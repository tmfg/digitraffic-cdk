import {ITask} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTimeForShiplist} from "../timeutil";
import {inTransaction} from "../../../../../common/postgres/database";

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTimeForShiplist(time);
    
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return await inTransaction(async (t: ITask<any>) => {
        return await ShiplistDB.findByLocode(t, startTime, endTime, locode);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}
