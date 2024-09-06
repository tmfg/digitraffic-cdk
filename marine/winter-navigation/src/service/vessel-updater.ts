import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { IbnetApi } from "../api/ibnet-api.js";
import type { Deleted, Vessel } from "../model/apidata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { saveAll } from "../db/vessels.js";
import { setDeleted } from "../db/deleted.js";

export async function updateVessels(api: IbnetApi, from: number, to: number): Promise<void> {
    const start = Date.now();
    const vessels = await api.getVessels(from, to);
    const deleted: Deleted[] = [];
    const updated: Vessel[] = [];

    vessels.forEach((vessel) => {
        if (vessel.deleted) {
            deleted.push(vessel);
        } else {
            updated.push(vessel);
        }
    });

    await inDatabase(async (db: DTDatabase) => {
        if (updated.length > 0) {
            await saveAll(db, updated);
        }

        if (deleted.length > 0) {
            await setDeleted(db, "wn_vessel", deleted);
        }
    });

    logger.info({
        method: "VesselUpdater.updateVessels",
        customUpdatedCount: updated.length,
        customDeletedCount: deleted.length,
        tookMs: Date.now() - start
    });
}
