import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {ApiEstimate} from "../../lib/model/estimate";
import {createEditObject, DbEstimate} from "../../lib/db/db-estimates";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('marine', 'marine', 'localhost:54321/marine', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'marine';
            process.env.DB_PASS = 'marine';
            process.env.DB_URI = 'localhost:54321/marine';
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
           db.none('DELETE FROM portcall_estimate'),
       ]);
    });
}

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<DbEstimate[]> {
    return db.tx(t => {
       return t.manyOrNone(`
        SELECT
            event_type,
            event_time,
            event_time_confidence_lower,
            event_time_confidence_upper,
            event_source,
            record_time,
            ship_id::int,
            ship_id_type,
            secondary_ship_id::int,
            secondary_ship_id_type,
            location_locode
        FROM portcall_estimate`);
    });
}
