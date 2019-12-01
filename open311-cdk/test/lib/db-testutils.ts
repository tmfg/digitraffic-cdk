import * as pgPromise from "pg-promise";

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.none('DELETE FROM open311_service_request');
}