import {DbMaintenanceTrackingData} from "../../lib/db/db-maintenance-tracking";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";
import {IDatabase} from "pg-promise";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM maintenance_tracking_data'),
       ]);
    });
}

export function findAll(db: IDatabase<any, any>): Promise<DbMaintenanceTrackingData[]> {
    return db.tx(t => {
       return t.manyOrNone(`
            SELECT id, json, status, hash
            FROM maintenance_tracking_data
            ORDER BY id
       `);
    });
}