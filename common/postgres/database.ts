import * as pgPromise from "pg-promise";
const pgp = require('pg-promise')();

export function initDbConnection(
    username: string,
    password: string,
    url: string,
    options?: object
): pgPromise.IDatabase<any, any> {
    return pgp(`postgresql://${username}:${password}@${url}`, options);
}

export async function inDatabase(fn: (db: pgPromise.IDatabase<any, any>) => any) {
    console.info("indatabase! init connection");

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    try {
        console.info("indatabase! run function");

        return await fn(db);
    } catch(e) {
        console.error("error in db:", e);
    } finally {
        console.info("finally closing");

        db.$pool.end();
    }
}