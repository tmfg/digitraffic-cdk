import { DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDb from "@digitraffic/common/dist/database/last-updated";
import * as DbData from "../dao/data";
import { TrackingSaveResult } from "../model/tracking-save-result";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export function sumResultsFromPromises(
    results: PromiseSettledResult<TrackingSaveResult>[]
): TrackingSaveResult {
    const saved = results.reduce(
        (acc, result) => acc + (result.status === "fulfilled" ? result.value.saved : 0),
        0
    );
    const errors = results.reduce(
        (acc, result) => acc + (result.status === "fulfilled" ? result.value.errors : 1),
        0
    );
    const sizeBytes = results.reduce(
        (acc, result) => acc + (result.status === "fulfilled" ? result.value.sizeBytes : 0),
        0
    );
    return new TrackingSaveResult(sizeBytes, saved, errors);
}

export function sumResults(results: TrackingSaveResult[], messageSizeOverride?: number): TrackingSaveResult {
    const saved = results.reduce((acc, result) => acc + result.saved, 0);
    const errors = results.reduce((acc, result) => acc + result.errors, 0);
    const sizeBytes = results.reduce((acc, result) => acc + result.sizeBytes, 0);
    return new TrackingSaveResult(messageSizeOverride ? messageSizeOverride : sizeBytes, saved, errors);
}

export function updateDataChecked(
    db: DTDatabase,
    domain: string,
    finalResult: TrackingSaveResult
): Promise<TrackingSaveResult> {
    const now = new Date();
    return LastUpdatedDb.updateLastUpdatedWithSubtype(
        db,
        LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA_CHECKED,
        domain,
        now
    )
        .then(() => finalResult)
        .catch((error: Error) => {
            logger.error({ method: "CommonUpdateService.updateDataUpdated", message: "failed", error });
            throw error;
        });
}

export function upsertDomain(domain: string): Promise<void> {
    return inDatabase((db: DTDatabase) => {
        return DbData.upsertDomain(db, domain);
    });
}
