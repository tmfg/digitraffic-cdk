import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {SpatialDisruption} from "../../lib/model/disruption";
import {createEditObject} from "../../lib/db/db-disruptions";

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

        afterAll(async () => {
            await truncate(db);
            db.$pool.end();
        });

        beforeEach(async () => {
            await truncate(db);
        });

        // @ts-ignore
        fn(db);
    };
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM bridgelock_disruption'),
       ]);
    });
}

export function insertDisruption(db: pgPromise.IDatabase<any, any>, disruptions: SpatialDisruption[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = disruptions.map(disruption => {
            return t.none(
                `INSERT INTO bridgelock_disruption(
                                  bridgelock_id,
                                  bridgelock_type_id,
                                  start_date,
                                  end_date,
                                  geometry,
                                  description_fi,
                                  description_sv,
                                  description_en,
                                  additional_info_fi,
                                  additional_info_sv,
                                  additional_info_en)
                           VALUES ($(bridgelock_id),
                                   $(bridgelock_type_id),
                                   $(start_date),
                                   $(end_date),
                                   $(geometry),
                                   $(description_fi),
                                   $(description_sv),
                                   $(description_en),
                                   $(additional_info_fi),
                                   $(additional_info_sv),
                                   $(additional_info_en))`, createEditObject(disruption));
        });
        return t.batch(queries);
    });
}
