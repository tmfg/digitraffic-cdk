import { SpatialDisruption } from "../lib/model/disruption";
import * as DisruptionsDb from "../lib/db/disruptions";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";

export function dbTestBase(fn: (db: DTDatabase) => void) {
    return commonDbTestBase(fn, truncate, "marine", "marine", "localhost:54321/marine");
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx((t) => {
        return t.batch([db.none("DELETE FROM bridgelock_disruption")]);
    });
}

const BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE = "BRIDGE_LOCK_DISRUPTIONS";
export async function insertDisruption(db: DTDatabase, disruptions: SpatialDisruption[]): Promise<void> {
    await db.tx(async (t) => {
        const queries: Promise<null>[] = disruptions.map((disruption) => {
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
                DisruptionsDb.createEditObject(disruption)
            );
        });
        await LastUpdatedDB.updateUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE, new Date());
        return t.batch(queries);
    });
}
