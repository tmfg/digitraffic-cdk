import {inDatabase} from 'digitraffic-lambda-postgres/database';
import * as pgPromise from "pg-promise";
import * as LastUpdatedDB from "../../../common/db/last-updated";

export function lastUpdated() {
    return inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const timestamp = await LastUpdatedDB.getLastUpdated(db, 'NW2_ANNOTATIONS');

        return timestamp == null ? new Date() : timestamp;
    });
}
