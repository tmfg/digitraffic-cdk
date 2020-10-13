import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {createUpdateValues, DbMaintenanceTrackingData} from "../../lib/db/db-maintenance-tracking";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
            await truncate(db);
        });

        afterAll(async () => {
            await truncate(db);
            db.$pool.end();
        });

        beforeEach(async () => {
            await truncate(db);
        });

        // @ts-ignore
        fn(db);
    };
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM maintenance_tracking_data'),
       ]);
    });
}

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<DbMaintenanceTrackingData[]> {
    return db.tx(t => {
       return t.manyOrNone(`
        SELECT
            id, json, status, hash
        FROM maintenance_tracking_data`);
    });
}