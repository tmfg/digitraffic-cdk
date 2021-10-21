import {IDatabase} from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

export async function insertActiveWarnings(db: IDatabase<any, any>, value: any): Promise<any> {
    return db.none('insert into cached_json(cache_id, content, last_updated) values ($1, $2, now())', [JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE, value]);
}

export async function insertArchivedWarnings(db: IDatabase<any, any>, value: any): Promise<any> {
    return db.none('insert into cached_json(cache_id, content, last_updated) values ($1, $2, now())', [JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED, value]);
}

async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM cached_json');
    });
}
