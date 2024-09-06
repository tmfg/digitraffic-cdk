import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { IbnetApi } from "../api/ibnet-api.js";
import type { Activity, Deleted } from "../model/apidata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { saveAll } from "../db/activities.js";
import { setDeleted } from "../db/deleted.js";

export async function updateActivities(api: IbnetApi, from: number, to: number): Promise<void> {
    const start = Date.now();
    const activities = await api.getActivities(from, to);
    const deleted: Deleted[] = [];
    const updated: Activity[] = [];

    activities.forEach((activity) => {
        if (activity.deleted) {
            deleted.push(activity);
        } else {
            updated.push(activity);
        }
    });

    await inDatabase(async (db: DTDatabase) => {
        if (updated.length > 0) {
            await saveAll(db, updated);
        }

        if (deleted.length > 0) {
            await setDeleted(db, "wn_activity", deleted);
        }
    });

    logger.info({
        method: "VesselUpdater.updateVessels",
        customUpdatedCount: updated.length,
        customDeletedCount: deleted.length,
        tookMs: Date.now() - start
    });
}
