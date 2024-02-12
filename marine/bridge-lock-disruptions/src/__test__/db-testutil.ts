import type { SpatialDisruption } from "../model/disruption.js";
import * as DisruptionsDb from "../db/disruptions.js";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import { BRIDGE_LOCK_DISRUPTIONS_CHECK, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE } from "../service/disruptions.js";

export function dbTestBase(fn: (db: DTDatabase) => void): () => void {
    return commonDbTestBase(fn, truncate, "marine", "marine", "127.0.0.1:54321/marine");
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx((t) => {
        return t.batch([db.none("DELETE FROM bridgelock_disruption")]);
    });
}

export interface UpdatedTimestamps {
    updated: number;
    checked: number;
}

export async function getUpdatedTimestamps(db: DTDatabase): Promise<UpdatedTimestamps> {
    const updated = await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_DATA_TYPE);
    const checked = await LastUpdatedDB.getUpdatedTimestamp(db, BRIDGE_LOCK_DISRUPTIONS_CHECK);

    if (!updated || !checked) {
        throw new Error("nulls detected");
    }

    return {
        updated: updated.getTime(),
        checked: checked.getTime()
    };
}

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
