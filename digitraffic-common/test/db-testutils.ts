import {DTDatabase, initDbConnection} from "../database/database";
import {DatabaseEnvironmentKeys} from "../aws/runtime/secrets/dbsecret";

export function dbTestBase(
    fn: (db: DTDatabase) => void,
    truncateFn: (db: DTDatabase) => void,
    dbUser: string,
    dbPass: string,
    dbUri: string,
): () => void {

    const theDbUri = process.env.DB_URI ?? dbUri;
    console.log(`Test database URI: ${theDbUri}`);

    return () => {
        const db: DTDatabase = initDbConnection(
            dbUser, dbPass, 'test', theDbUri, {
                noWarnings: true, // ignore duplicate connection warning for tests
            },
        );

        beforeAll(async () => {
            process.env[DatabaseEnvironmentKeys.DB_USER] = dbUser;
            process.env[DatabaseEnvironmentKeys.DB_PASS] = dbPass;
            process.env[DatabaseEnvironmentKeys.DB_URI] = theDbUri;
            process.env[DatabaseEnvironmentKeys.DB_RO_URI] = theDbUri;
            await truncateFn(db);
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
