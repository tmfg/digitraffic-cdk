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
        await t.none(`insert into permit(id, source_id, version, source, permit_type, permit_subject, geometry, effective_from, created, modified)
                      values (default, $1, default, 'Lahden kaupunki', 'Kaivulupa', $2, point(10, 10)::geometry, now(), now(),
                              now())`, [id, subject]);
    });
}

export function insertPermitOrUpdateGeometry(db: DTDatabase, subject: string, source: string, sourceId: string) {
    return db.tx(async t => {
        await t.none(`INSERT INTO permit(id, version, source_id, source, permit_subject, permit_type, geometry, effective_from, created, modified)
                      values (default, default, $1, $2, $3, 'Kaivulupa', point(10, 10)::geometry, now(), now(),
                              now())
                      ON CONFLICT (source_id, source)
                          DO UPDATE
                          SET geometry=ST_Collect(ARRAY(SELECT (ST_Dump(geometry)).geom FROM permit WHERE source_id = $1 AND source = $2)
                              || point(20, 20)::geometry)`, [sourceId, source, subject]);
    });
}