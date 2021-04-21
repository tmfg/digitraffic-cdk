import {DbMaintenanceTrackingData, DbObservationData} from "../../lib/db/db-maintenance-tracking";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";
import {IDatabase} from "pg-promise";


export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM maintenance_tracking_data'),
           db.none('DELETE FROM maintenance_tracking_observation_data'),
       ]);
    });
}

export function findAllTrackings(db: IDatabase<any, any>): Promise<DbMaintenanceTrackingData[]> {
    return db.tx(t => {
       return t.manyOrNone(`
            SELECT id, json, status, hash
            FROM maintenance_tracking_data
            ORDER BY id
       `);
    });
}

export function findAllObservations(db: IDatabase<any, any>): Promise<DbObservationData[]> {
    return db.tx(t => {
        return t.manyOrNone(`
            SELECT  id,
                    observation_time,
                    sending_time,
                    json,
                    harja_workmachine_id,
                    harja_contract_id,
                    status,
                    hash,
                    s3_uri
            FROM maintenance_tracking_observation_data
            ORDER BY observation_time
       `);
    });
}