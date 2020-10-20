import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {IDatabase} from "pg-promise";

export async function getEstimates(locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();

    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await ShiplistDB.findByLocode(db, locode);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}