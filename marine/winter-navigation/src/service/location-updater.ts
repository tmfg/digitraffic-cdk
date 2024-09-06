import { type IbnetApi } from "../api/ibnet-api.js";
import type { Deleted, Location } from "../model/apidata.js";
import { saveAll } from "../db/locations.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import { setDeleted } from "../db/deleted.js";

export async function updateLocations(api: IbnetApi, from: number, to: number): Promise<void> {
    const start = Date.now();
    const locations = await api.getLocations(from, to);
    const deleted: Deleted[] = [];
    const updated: Location[] = [];

    locations.forEach((location) => {
        if (location.deleted) {
            deleted.push(location);
        } else {
            updated.push(location);
        }
    });

    await inDatabase(async (db: DTDatabase) => {
        if (updated.length > 0) {
            await saveAll(db, updated);
        }

        if (deleted.length > 0) {
            await setDeleted(db, "wn_location", deleted);
        }
    });

    logger.info({
        method: "LocationUpdater.updateLocations",
        customUpdatedCount: updated.length,
        customDeletedCount: deleted.length,
        tookMs: Date.now() - start
    });
}
