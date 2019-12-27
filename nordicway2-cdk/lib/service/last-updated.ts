import {inDatabase} from 'digitraffic-lambda-postgres/database';
import * as pgPromise from "pg-promise";
import * as LastUpdatedDB from "../db/db-last-updated";

export function lastUpdated() {
    return inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const timestamp = await LastUpdatedDB.getLastUpdated(db)

        return timestamp == null ? new Date() : timestamp;
    });
}
