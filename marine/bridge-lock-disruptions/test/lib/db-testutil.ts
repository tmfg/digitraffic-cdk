import * as pgPromise from "pg-promise";
import {SpatialDisruption} from "../../lib/model/disruption";
import {createEditObject} from "../../lib/db/db-disruptions";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
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
                `INSERT INTO bridgelock_disruption(id,
                                                   type_id,
                                                   start_date,
                                                   end_date,
                                                   geometry,
                                                   description_fi,
                                                   description_sv,
                                                   description_en)
                 VALUES ($(id),
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
