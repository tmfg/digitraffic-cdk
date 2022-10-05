import {SpatialDisruption} from "../lib/model/disruption";
import * as DisruptionsDb from '../lib/db/disruptions';
import {dbTestBase as commonDbTestBase} from "@digitraffic/common/test/db-testutils";
import {DTDatabase} from "@digitraffic/common/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(
        fn, truncate, 'marine', 'marine', 'localhost:54321/marine',
    );
}

export function truncate(db: DTDatabase): Promise<null[]> {
    return db.tx(t => {
        return t.batch([
            db.none('DELETE FROM bridgelock_disruption'),
        ]);
    });
}

export function insertDisruption(db: DTDatabase, disruptions: SpatialDisruption[]): Promise<null[]> {
    return db.tx(t => {
        const queries: Promise<null>[] = disruptions.map(disruption => {
            return t.none(`INSERT INTO bridgelock_disruption(id,
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
            DisruptionsDb.createEditObject(disruption));
        });
        return t.batch(queries);
    });
}
