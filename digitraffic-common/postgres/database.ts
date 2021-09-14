import {IDatabase, ITask} from "pg-promise";
import {DatabaseEnvironmentKeys} from "../secrets/dbsecret";
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

/**
 * Creates a non-pooling database connection primarily used by Lambdas.
 *
 * Note! Using this method opens a new RDS connection on every invocation. It is advised to
 * use RDS proxy to pool connections transparently.
 * https://docs.amazonaws.cn/en_us/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html
 * @param username Username
 * @param password Password
 * @param url Connection URL
 * @param options pg-promise options
 */
export function initDbConnection(
    username: string,
    password: string,
    url: string,
    options?: object
): IDatabase<any, any> {
    return pgp(`postgresql://${username}:${password}@${url}`, options);
}

export async function inTransaction (
    fn: (db: ITask<any>) => any): Promise<any> {

    return inDatabase(db => db.tx((t: ITask<any>) => fn(t)));
}

export async function inDatabase(
    fn: (db: IDatabase<any, any>) => any): Promise<any> {
    return doInDatabase(false, fn);
}

export async function inDatabaseReadonly(
    fn: (db: IDatabase<any, any>) => any): Promise<any> {
    return doInDatabase(true, fn);
}

async function doInDatabase(
    readonly: boolean,
    fn: (db: IDatabase<any, any>) => any): Promise<any> {
    const db = initDbConnection(
        process.env[DatabaseEnvironmentKeys.DB_USER] as string,
        process.env[DatabaseEnvironmentKeys.DB_PASS] as string,
        (readonly ? process.env[DatabaseEnvironmentKeys.DB_RO_URI] : process.env[DatabaseEnvironmentKeys.DB_URI]) as string
    );
    try {
        // deallocate all prepared statements to allow for connection pooling
        // DISCARD instead of DEALLOCATE as it didn't always clean all prepared statements
        await db.none('DISCARD ALL');
        return await fn(db);
    } catch(e) {
        console.error("Error in db:", e);
        throw e;
    } finally {
        db.$pool.end();
    }
}
