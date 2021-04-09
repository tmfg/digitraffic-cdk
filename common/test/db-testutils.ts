import {IDatabase,ITask} from "pg-promise";
import {initDbConnection} from "../postgres/database";

export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}

export function dbTestBase(
    fn: (db: IDatabase<any, any>) => void,
    truncateFn: (db: IDatabase<any, any>) => any,
    dbUser: string,
    dbPass: string,
    dbHost: string) {

    const theDbHost = process.env.DB_HOST ?? dbHost;

    return () => {
        const db: IDatabase<any, any> = initDbConnection(dbUser, dbPass, theDbHost, {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = dbUser;
            process.env.DB_PASS = dbPass;
            process.env.DB_URI = theDbHost;
            await truncateFn(db);
        });

        afterAll(async () => {
            await truncateFn(db);
            db.$pool.end();
        });

        beforeEach(async () => {
            await truncateFn(db);
        });

        // @ts-ignore
        fn(db);
    };
}
