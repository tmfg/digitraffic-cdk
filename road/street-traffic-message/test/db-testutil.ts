import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DTDatabase} from "digitraffic-common/database/database";
import {ApiPermit} from "../lib/model/permit";

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
                      values (default, $1, default, 'Lahden kaupunki', 'Kaivulupa', $2, ST_ForceCollection(point(10, 10)::geometry), now(), now(),
                              now())`, [id, subject]);
    });
}

export function insertPermitOrUpdateGeometry(db: DTDatabase, permit: ApiPermit) {
    return db.tx(async t => {
        await t.none(
            `INSERT INTO permit
             (id, source_id, source, permit_type, permit_subject, effective_from, effective_to, created, modified, version, geometry)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, NOW(), NOW(), DEFAULT, ST_ForceCollection(ST_Transform(ST_GeomFromGML($7), 4326)))
             ON CONFLICT (source_id, source)
                 DO UPDATE
                 SET geometry=ST_ForceCollection(ST_Collect(
                             ARRAY(SELECT (ST_Dump(geometry)).geom FROM permit WHERE source_id = $1 AND source = $2)
                             || ST_Transform(ST_GeomFromGML($7), 4326)))`,
            [permit.sourceId, permit.source, permit.permitType, permit.permitSubject, permit.effectiveFrom,
                permit.effectiveTo, permit.gmlGeometryXmlString]);
    });
}
