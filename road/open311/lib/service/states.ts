import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    update as dbUpdate
} from '../db/db-states';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {ServiceRequestState} from "../model/service-request-state";
import {Locale} from "../model/locale";

export async function findAll(locale: Locale): Promise<ServiceRequestState[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(locale, db);
    });
}

export async function update(
    states: ServiceRequestState[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(states, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateStates updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
