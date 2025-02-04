import { inDatabase, inDatabaseReadonly, type DTDatabase } from "@digitraffic/common/dist/database/database";
import { NemoApi } from "../api/nemo-api.js";
import type { DbVisit } from "../model/db-schema.js";
import * as VisitDAO from "../db/visits.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import { addDays, subDays } from "date-fns";

const DATATYPE = "PC2_VISITS" as const;

// what format? json or geojson?
export async function findAllVisits(): Promise<[DbVisit[], Date]> {
    const visits = await inDatabaseReadonly((db: DTDatabase) => {
        return VisitDAO.findAllVisits(db);
    });

    // get from visits
    return [visits, new Date()];
}

/// get "from" timestamp from database, or if not yet present use now-30 days
async function getLastUpdated(): Promise<Date> {
    return await inDatabaseReadonly((db: DTDatabase) => {
        return LastUpdatedDB.getUpdatedTimestamp(db, DATATYPE);
    }) ?? subDays(new Date(), 30);
}

/// calculate "to" timestamp, maximum of 24h from "from" timetimestamp
function getTo(from: Date): Date {
    const now = new Date();

    if(from < subDays(now, 1)) {
        return addDays(from, 1);
    }

    return now;
}

export async function updateVisits(url: string, ca: string, privateKey: string, certificate: string): Promise<VisitDAO.DbInsertedUpdated> {
    const api = new NemoApi(url, ca, privateKey, certificate);

    const from = await getLastUpdated();
    const to = getTo(from);

    const response = await api.getVisits(from, to);

    return await inDatabase(async (db: DTDatabase) => {
        let updated;

        if(response.length === 0) {
            updated = {
                inserted: 0,
                updated: 0
            }
        } else {    
            updated = VisitDAO.upsertVisits(db, response);
        }

        await LastUpdatedDB.updateUpdatedTimestamp(db, DATATYPE, to);

        return updated;
    });
}