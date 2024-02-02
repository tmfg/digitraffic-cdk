import * as StatesDb from "../db/states.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { ServiceRequestState } from "../model/service-request-state.js";
import { Locale } from "../model/locale.js";

export function findAll(locale: Locale): Promise<ServiceRequestState[]> {
    return inDatabase((db: DTDatabase) => {
        return StatesDb.findAll(locale, db);
    });
}

export function update(states: ServiceRequestState[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return StatesDb.update(states, db);
    }).then((a) => {
        const end = Date.now();
        console.info("method=updateStates updatedCount=%d tookMs=%d", a.length, end - start);
    });
}
