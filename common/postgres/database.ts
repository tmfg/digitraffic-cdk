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
