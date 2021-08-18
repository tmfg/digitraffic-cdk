import * as pgPromise from "pg-promise";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {IDatabase} from "pg-promise";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
}

export async function setup(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
        return t.batch([
            db.none('insert into device(id,updated_date,type,road_address) ' +
                'values(\'KRM015651\',current_date,\'TEST\', \'TEST\')'),
            db.none('insert into device(id,updated_date,type,road_address) ' +
                'values(\'KRM015511\',current_date,\'TEST\', \'TEST\')')
        ]);
    });
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
        return t.batch([
            db.none('delete from device'),
            db.none('delete from device_data_datex2'),
        ]);
    });

}


