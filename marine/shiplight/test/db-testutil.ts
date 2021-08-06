import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {IDatabase} from "pg-promise";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM areatraffic');
        await db.none('DELETE FROM vessel_location');
        await db.none('DELETE FROM vessel');
    });
}
