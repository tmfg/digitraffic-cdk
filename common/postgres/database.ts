import {IDatabase} from "pg-promise";

const pgp = require('pg-promise')();

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

export async function inDatabase(
    fn: (db: IDatabase<any, any>) => any) {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        return await fn(db);
    } catch(e) {
        console.error("Error in db:", e);
        throw e;
    } finally {
        db.$pool.end();
    }
}
