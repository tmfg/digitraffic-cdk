import { DatabaseEnvironmentKeys, type DTDatabase, initDbConnection } from "../database/database.mjs";
import type { Countable } from "../database/models.mjs";

export async function assertCount(db: DTDatabase, sql: string, count: number) {
    await db.one(sql).then((x: Countable) => expect(x.count).toEqual(count));
}

export function dbTestBase(
    fn: (db: DTDatabase) => void,
    truncateFn: (db: DTDatabase) => Promise<void>,
    dbUser: string,
    dbPass: string,
    dbUri: string,
): () => void {
    const theDbUri = process.env["DB_URI"] ?? dbUri;
    console.log(`Test database URI: ${theDbUri}`);

    return () => {
        const db: DTDatabase = initDbConnection(dbUser, dbPass, "test", theDbUri, {
            noWarnings: true, // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env[DatabaseEnvironmentKeys.DB_USER] = dbUser;
            process.env[DatabaseEnvironmentKeys.DB_PASS] = dbPass;
            process.env[DatabaseEnvironmentKeys.DB_URI] = theDbUri;
            process.env[DatabaseEnvironmentKeys.DB_RO_URI] = theDbUri;

            // if there's no connection to the database, it will be caught here
            try {
                await truncateFn(db);
            } catch (e) {
                console.info("cought in commonDbTest:" + JSON.stringify(e));
                throw e;
            }
        });

        afterAll(async () => {
            await truncateFn(db);
            await db.$pool.end();
        });

        beforeEach(async () => {
            await truncateFn(db);
        });

        fn(db);
    };
}
