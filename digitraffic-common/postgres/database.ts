import {IDatabase, ITask} from "pg-promise";
import {DatabaseEnvironmentKeys} from "../secrets/dbsecret";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pgp = require('pg-promise')();

// convert numeric types to number instead of string
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.INT8, (value: string) => {
    return parseInt(value);
});

pgp.pg.types.setTypeParser(pgp.pg.types.builtins.FLOAT8, (value: string) => {
    return parseFloat(value);
});

pgp.pg.types.setTypeParser(pgp.pg.types.builtins.NUMERIC, (value: string) => {
    return parseFloat(value);
});

export type DTDatabase = IDatabase<unknown>;

export type DTTransaction = ITask<unknown>

/**
 * Creates a non-pooling database connection primarily used by Lambdas.
 *
 * Note! Using this method opens a new RDS connection on every invocation. It is advised to
 * use RDS proxy to pool connections transparently.
 * https://docs.amazonaws.cn/en_us/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html
 * @param username Username
 * @param password Password
 * @param applicationName name of application
 * @param url Connection URL
 * @param options pg-promise options
 */
export function initDbConnection(
    username: string,
    password: string,
    applicationName: string,
    url: string,
    options?: object,
): DTDatabase {
    const finalUrl = `postgresql://${username}:${password}@${url}?application_name=${applicationName}`;

    return pgp(finalUrl, options);
}

export function inTransaction<T> (fn: (db: DTTransaction) => Promise<T>): Promise<T> {
    return inDatabase(db => db.tx((t: DTTransaction) => fn(t)));
}

export function inDatabase<T>(fn: (db: DTDatabase) => Promise<T>): Promise<T> {
    return doInDatabase(false, fn);
}

export function inDatabaseReadonly<T>(fn: (db: DTDatabase) => Promise<T>): Promise<T> {

    return doInDatabase(true, fn);
}

async function doInDatabase<T>(readonly: boolean,
    fn: (db: DTDatabase) => Promise<T>): Promise<T> {
    const db = initDbConnection(process.env[DatabaseEnvironmentKeys.DB_USER] as string,
        process.env[DatabaseEnvironmentKeys.DB_PASS] as string,
        process.env[DatabaseEnvironmentKeys.DB_APPLICATION] || 'unknown-cdk-application',
        (readonly ? process.env[DatabaseEnvironmentKeys.DB_RO_URI] : process.env[DatabaseEnvironmentKeys.DB_URI]) as string);
    try {
        // deallocate all prepared statements to allow for connection pooling
        // DISCARD instead of DEALLOCATE as it didn't always clean all prepared statements
        await db.none('DISCARD ALL');
        return await fn(db);
    } catch (e) {
        console.error("Error in db:", e);
        throw e;
    } finally {
        db.$pool.end();
    }
}
