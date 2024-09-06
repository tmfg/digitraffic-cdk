import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { IbnetApi } from "../api/ibnet-api.js";
import type { Deleted, Restriction } from "../model/apidata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { saveAll } from "../db/restrictions.js";
import { setDeleted } from "../db/deleted.js";

export async function updateRestrictions(api: IbnetApi, from: number, to: number): Promise<void> {
    const start = Date.now();
    const restrictions = await api.getRestrictions(from, to);
    const deleted: Deleted[] = [];
    const updated: Restriction[] = [];

    restrictions.forEach((restriction) => {
        if (restriction.deleted) {
            deleted.push(restriction);
        } else {
            updated.push(restriction);
        }
    });

    logger.debug("restrictions:" + JSON.stringify(updated));

    await inDatabase(async (db: DTDatabase) => {
        if (updated.length > 0) {
            await saveAll(db, updated);
        }

        if (deleted.length > 0) {
            await setDeleted(db, "wn_restriction", deleted);
        }
    });

    logger.info({
        method: "RestrictionUpdater.updateRestrictions",
        customUpdatedCount: updated.length,
        customDeletedCount: deleted.length,
        tookMs: Date.now() - start
    });
}
