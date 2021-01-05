import {inDatabase} from '../../../../common/postgres/database';
import * as LastUpdatedDB from "../../../../common/db/last-updated";

import * as pgPromise from "pg-promise";

export function lastUpdated() {
    return inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
        const timestamp = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.NW2_ANNOTATIONS);

        return timestamp ?? new Date();
    });
}
