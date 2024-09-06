import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { IbnetApi } from "../api/ibnet-api.js";
import type { Deleted, Source } from "../model/apidata.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { setDeleted } from "../db/deleted.js";
import { saveAll } from "../db/sources.js";

export async function updateSources(api: IbnetApi, from: number, to: number): Promise<void> {
    const start = Date.now();
    const sources = await api.getSources(from, to);
    const deleted: Deleted[] = [];
    const updated: Source[] = [];

    sources.forEach((source) => {
        if (source.deleted) {
            deleted.push(source);
        } else {
            updated.push(source);
        }
    });

    await inDatabase(async (db: DTDatabase) => {
        if (updated.length > 0) {
            await saveAll(db, updated);
        }

        if (deleted.length > 0) {
            await setDeleted(db, "wn_source", deleted);
        }
    });

    logger.info({
        method: "SourceUpdater.updateSources",
        customUpdatedCount: updated.length,
        customDeletedCount: deleted.length,
        tookMs: Date.now() - start
    });
}
