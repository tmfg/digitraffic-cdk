import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DTDatabase} from "digitraffic-common/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async t => {
        await t.none('DELETE FROM permit');
    });
}

export function insertPermit(db: DTDatabase, id: number, subject: string) {
    return db.tx(async t => {
        await t.none(`insert into permit(id, source_id, version, permit_type, permit_subject, geometry, effective_from, created_at)
values ($1, $1, 1, 'Kaivulupa', $2, point(10, 10)::geometry, now(), now())`, [id, subject]);
    });
}