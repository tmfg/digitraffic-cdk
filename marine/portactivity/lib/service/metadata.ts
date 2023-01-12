import * as MetadataDB from "../dao/metadata";
import {
    DTDatabase,
    inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { EventSource } from "../model/eventsource";

export const PREDICTION_SOURCES = [
    EventSource.SCHEDULES_CALCULATED,
    EventSource.AWAKE_AI,
    EventSource.AWAKE_AI_PRED,
];

export async function getLocodesWithPredictions(): Promise<string[]> {
    return await inDatabaseReadonly(async (db: DTDatabase) => {
        const locodes = await MetadataDB.findLocodesBySource(db, [
            PREDICTION_SOURCES,
        ]);
        return locodes.flat();
    });
}
