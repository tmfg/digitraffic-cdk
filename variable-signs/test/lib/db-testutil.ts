import * as pgPromise from "pg-promise";
import {initDbConnection, inDatabase} from "digitraffic-lambda-postgres/database";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
        });

        afterAll(async () => {
            await truncate(db);
            db.$pool.end();
        });

        // @ts-ignore
        fn(db);
    };
}

export function testBase(fn: (arg0: any) => void) {
    return () => {
        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
        });

        afterAll(async () => {
            return inDatabase(async (db: pgPromise.IDatabase<any,any>) => {
                await truncate(db);
            });
        });

        // @ts-ignore
        fn();
    };
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.none('select 1');
//    return db.none('DELETE FROM nw2_annotation');
}


