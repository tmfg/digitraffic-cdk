import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DTDatabase} from "digitraffic-common/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

function truncate(db: DTDatabase): Promise<void> {
    return db.tx(async t => {
        await t.none('DELETE FROM excavation_permits');
    });
}

export function insertPermit(db: DTDatabase, id: number, subject: string) {
    return db.tx(async t => {
        await t.none(`insert into excavation_permits(id, subject, geometry, effective_from, effective_to)
values ($1, $2, point(10, 10)::geometry, now(), null)`, [id, subject]);
    });
}