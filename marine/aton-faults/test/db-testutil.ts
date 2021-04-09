import {IDatabase} from "pg-promise";
import {Fault} from "../lib/model/fault";
import {dbTestBase as commonDbTestBase} from "../../../common/test/db-testutils";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM aton_fault');
    });
}

export function insert(db: IDatabase<any, any>, faults: Fault[]) {
    return db.tx(t => {
        return t.batch(faults.map(f => {
            return t.none(`
                insert into aton_fault(
                    id,
                    entry_timestamp,
                    fixed_timestamp,
                    state,
                    type,
                    domain,
                    fixed,
                    aton_id,
                    aton_name_fi,
                    aton_name_se,
                    aton_type_fi,
                    fairway_number,
                    fairway_name_fi,
                    fairway_name_se,
                    area_number,
                    geometry)
                values(
                       $1,
                       $2,
                       $3,
                       $4,
                       $5,
                       $6,
                       $7,
                       $8,
                       $9,
                       $10,
                       $11,
                       $12,
                       $13,
                       $14,
                       $15,
                       ST_GEOMFROMTEXT($16)
                )
            `, [
                f.id,
                f.entry_timestamp,
                f.fixed_timestamp,
                f.state,
                f.type,
                f.domain,
                f.fixed,
                f.aton_id,
                f.aton_name_fi,
                f.aton_name_se,
                f.aton_type_fi,
                f.fairway_number,
                f.fairway_name_fi,
                f.fairway_name_se,
                f.area_number,
                f.geometry
            ]);
        }));
    });
}
