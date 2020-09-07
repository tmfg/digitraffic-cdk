import * as SubscriptionsDB from "../db/db-subscriptions"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {DbSubscription} from "../db/db-subscriptions";

export async function findSubscriptions(mmsis: number[], imos: number[]): Promise<DbSubscription[]> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await SubscriptionsDB.findSubscriptions(db,
            mmsis,
            imos);
    });
}
