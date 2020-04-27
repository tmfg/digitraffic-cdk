import {IDatabase} from "pg-promise";

const pgp = require('pg-promise')();

export function initDbConnection(
    username: string,
    password: string,
    url: string,
    options?: object
): IDatabase<any, any> {
    return pgp(`postgresql://${username}:${password}@${url}`, options);
}

let db: IDatabase<any, any>;

export async function inDatabase(
    fn: (db: IDatabase<any, any>) => any,
    dbParam?: IDatabase<any, any>)
{
    db = db ?? dbParam ?? initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        return await fn(db);
    } catch(e) {
        console.error("Error in db:", e);
    }
}
