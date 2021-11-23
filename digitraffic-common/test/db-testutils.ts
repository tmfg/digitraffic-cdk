import {IDatabase,ITask} from "pg-promise";
import {initDbConnection} from "../postgres/database";
import {DatabaseEnvironmentKeys} from "../secrets/dbsecret";

/*
export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}*/

export function dbTestBase(
    fn: (db: IDatabase<any, any>) => void,
    truncateFn: (db: IDatabase<any, any>) => any,
    dbUser: string,
    dbPass: string,
    dbUri: string): () => void {

    const theDbUri = process.env.DB_URI ?? dbUri;
    console.log(`Test database URI: ${theDbUri}`);

    return () => {
        const db: IDatabase<any, any> = initDbConnection(dbUser, dbPass, 'test', theDbUri, {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env[DatabaseEnvironmentKeys.DB_USER] = dbUser;
            process.env[DatabaseEnvironmentKeys.DB_PASS] = dbPass;
            process.env[DatabaseEnvironmentKeys.DB_URI] = theDbUri;
            process.env[DatabaseEnvironmentKeys.DB_RO_URI] = theDbUri;
            await truncateFn(db);
        });

        afterAll(async () => {
            await truncateFn(db);
            db.$pool.end();
        });

        beforeEach(async () => {
            await truncateFn(db);
        });

        fn(db);
    };
}
