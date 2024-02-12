import * as StatesDb from "../db/states.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { ServiceRequestState } from "../model/service-request-state.js";
import type { Locale } from "../model/locale.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

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
        logger.info({
            method: "open311ServiceStates.update",
            customUpdatedCount: a.length,
            customTookMs: end - start
        });
    });
}
