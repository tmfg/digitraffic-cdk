import {IDatabase} from "pg-promise";
import * as StatesDb from '../db/states';
import {inDatabase} from "../../../../common/postgres/database";
import {ServiceRequestState} from "../model/service-request-state";
import {Locale} from "../model/locale";

export async function findAll(locale: Locale): Promise<ServiceRequestState[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await StatesDb.findAll(locale, db);
    });
}

export async function update(
    states: ServiceRequestState[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await StatesDb.update(states, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateStates updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
