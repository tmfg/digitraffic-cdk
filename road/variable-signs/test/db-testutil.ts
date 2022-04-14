import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {DTDatabase} from "digitraffic-common/database/database";

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

export function truncate(db: DTDatabase) {
    return db.tx(t => {
        return t.batch([
            db.none('delete from device'),
            db.none('delete from device_data_datex2'),
            db.none('delete from device_data_row'),
            db.none('delete from device_data'),
        ]);
    });

}


