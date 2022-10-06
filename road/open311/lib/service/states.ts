import * as StatesDb from '../db/states';
import {DTDatabase, inDatabase} from "@digitraffic/common/database/database";
import {ServiceRequestState} from "../model/service-request-state";
import {Locale} from "../model/locale";

export function findAll(locale: Locale): Promise<ServiceRequestState[]> {
    return inDatabase((db: DTDatabase) => {
        return StatesDb.findAll(locale, db);
    });
}

export function update(states: ServiceRequestState[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return StatesDb.update(states, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateStates updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
