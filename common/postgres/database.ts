import * as pgPromise from "pg-promise";

const pgp = require('pg-promise')();

export function initDb(
    username: string,
    password: string,
    url: string
): pgPromise.IDatabase<any, any> {
    return pgp(`postgresql://${username}:${password}@${url}`);
}
