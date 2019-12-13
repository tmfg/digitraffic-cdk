import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';

            process.env.ENDPOINT_USER = 'xxx';
            process.env.ENDPOINT_PASS = 'xxxx';
            process.env.ENDPOINT_LOGIN_URL = 'https://api.vionice.io/api/v1';
        });

        // @ts-ignore
        fn(db);
    };
}

