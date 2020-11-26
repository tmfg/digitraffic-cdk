import * as pgPromise from "pg-promise";
import {initDbConnection, inDatabase} from "digitraffic-lambda-postgres/database";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
            await truncate(db);
        });

        beforeEach(async () => {
           await setup(db);
        });

        afterEach(async () => {
            await truncate(db);
        });

        afterAll(async () => {
            db.$pool.end();
        });

        // @ts-ignore
        fn(db);
    };
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


