import {dbTestBase as commonDbTestBase} from "@digitraffic/common/test/db-testutils";
import {DTDatabase} from "@digitraffic/common/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'road', 'road', 'localhost:54322/road',
    );
}

export function setup(db: DTDatabase) {
    return db.tx(t => {
        return t.batch([
            db.none('insert into device(id,updated_date,type,road_address) ' +
                'values(\'KRM015651\',current_date,\'TEST\', \'TEST\')'),
            db.none('insert into device(id,updated_date,type,road_address) ' +
                'values(\'KRM015511\',current_date,\'TEST\', \'TEST\')'),
        ]);
    });
}

export async function truncate(db: DTDatabase) {
    await db.tx(async t => {
        await t.none('delete from device');
        await t.none('delete from device_data_datex2');
        await t.none('delete from device_data_row');
        await t.none('delete from device_data');
    });
}


