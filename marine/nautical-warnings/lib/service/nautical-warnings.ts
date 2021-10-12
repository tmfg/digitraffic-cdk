import {NauticalWarningsApi} from "../api/nautical-warnings";
import * as NauticalWarningsDAO from "../db/nautical-warnings";
import {inDatabase, inDatabaseReadonly} from "../../../../digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";

const CACHE_KEY_ACTIVE = 'nautical-warnings-active';
const CACHE_KEY_ARCHIVED = 'nautical-warnings-archived';

export function getActiveWarnings() {
    return inDatabaseReadonly(async (db: IDatabase<any, any>) => {
        return NauticalWarningsDAO.getValueFromCache(db, CACHE_KEY_ACTIVE);
    });
}

export function getArchivedWarnings() {
    return inDatabaseReadonly(async (db: IDatabase<any, any>) => {
        return NauticalWarningsDAO.getValueFromCache(db, CACHE_KEY_ARCHIVED);
    });
}

export async function updateNauticalWarnings(url: string): Promise<any> {
    const api = new NauticalWarningsApi(url);
    const active = await api.getActiveWarnings();
    const archived = await api.getArchivedWarnings();

    console.info("DEBUG active " + JSON.stringify(active, null, 2));
    console.info("DEBUG archived " + JSON.stringify(archived, null, 2));

    return inDatabase(async (db: IDatabase<any, any>) => {
        return db.tx((tx: any) => {
            NauticalWarningsDAO.updateCache(tx, CACHE_KEY_ARCHIVED, archived);
            NauticalWarningsDAO.updateCache(tx, CACHE_KEY_ACTIVE, active);
        });
    });
}