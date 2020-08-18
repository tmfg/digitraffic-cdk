import * as LastUpdatedDB from "../../../common/db/last-updated";
import {DataType} from "../../../common/db/last-updated";
import * as EstimatesDB from "../db/db-estimates"
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {ApiEstimate} from "../model/estimate";

export async function saveEstimates(estimates: ApiEstimate[]) {
    const start = Date.now();
    await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(t => {
            return t.batch(
                EstimatesDB.updateEstimates(db, estimates)
                //LastUpdatedDB.updateLastUpdated(db, DataType.PORTCALL_ESTIMATES, new Date(start))
            );
        });
    }).then(a => {
        const end = Date.now();
        console.info("method=saveEstimates updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
