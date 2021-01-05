import * as pgPromise from "pg-promise";
import {initDbConnection} from "../../../../common/postgres/database";
import {SpatialDisruption} from "../../lib/model/disruption";
import {createEditObject} from "../../lib/db/db-disruptions";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('marine', 'marine', 'localhost:54321/marine', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'marine';
            process.env.DB_PASS = 'marine';
            process.env.DB_URI = 'localhost:54321/marine';
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
                                  id,
                                  type_id,
                                  start_date,
                                  end_date,
                                  geometry,
                                  description_fi,
                                  description_sv,
                                  description_en)
                           VALUES (
                                  $(id),
                                  $(type_id),
                                  $(start_date),
                                  $(end_date),
                                  ST_GeomFromGeoJSON($(geometry)),
                                  $(description_fi),
                                  $(description_sv),
                                  $(description_en))`,
                createEditObject(disruption));
        });
        return t.batch(queries);
    });
}
