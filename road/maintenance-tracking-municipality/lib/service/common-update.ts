import {DTDatabase, inDatabase} from "digitraffic-common/database/database";
import * as LastUpdatedDb from "digitraffic-common/database/last-updated";
import {TrackingSaveResult} from "../model/tracking-save-result";
import * as DbData from "../dao/data";

export function sumResultsFromPromises(results: PromiseSettledResult<TrackingSaveResult>[]): TrackingSaveResult {
    const saved = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.saved : 0), 0);
    const errors = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.errors : 1), 0);
    const sizeBytes = results.reduce((acc, result) => acc + (result.status === 'fulfilled' ? result.value.sizeBytes : 0), 0);
    return new TrackingSaveResult(sizeBytes, saved, errors);
}

export function sumResults(results: TrackingSaveResult[], messageSizeOverride?: number): TrackingSaveResult {
    const saved = results.reduce((acc, result) => acc + result.saved, 0);
    const errors = results.reduce((acc, result) => acc + result.errors, 0);
    const sizeBytes = results.reduce((acc, result) => acc + result.sizeBytes, 0);
    return new TrackingSaveResult(messageSizeOverride ? messageSizeOverride : sizeBytes, saved, errors);
}

export function updateDataUpdated(finalResult: TrackingSaveResult): Promise<TrackingSaveResult> {
    return inDatabase(async (db: DTDatabase) => {
        const now = new Date();
        await LastUpdatedDb.updateLastUpdated(db, LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA_CHECKED, now);
        if (finalResult.saved > 0) {
            await LastUpdatedDb.updateLastUpdated(db, LastUpdatedDb.DataType.MAINTENANCE_TRACKING_DATA, now);
        }
    }).then(() => {
        return finalResult;
    });
}

export function upsertDomain(domain: string): Promise<null> {
    return inDatabase((db: DTDatabase) => {
        return DbData.upsertDomain(db, domain);
    });
}
