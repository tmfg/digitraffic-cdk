import {IDatabase} from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

export async function truncate(db: IDatabase<any, any>): Promise<null> {
    return db.none('DELETE FROM nw2_annotation');
}
