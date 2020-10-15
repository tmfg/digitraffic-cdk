import * as LastUpdatedDB from "../../../../../common/db/last-updated";
import * as EstimatesDB from "../db/db-estimates"
import {DbEstimate} from "../db/db-estimates"
import {inDatabase} from "../../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {ApiEstimate} from "../model/estimate";

const PORTCALL_ESTIMATES_DATA_TYPE = 'PORTCALL_ESTIMATES';

export interface UpdatedEstimate {
    readonly ship_mmsi: number
    readonly ship_imo: number
}

export async function saveEstimate(estimate: ApiEstimate): Promise<UpdatedEstimate | undefined> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(t => {
            const queries = [
                EstimatesDB.updateEstimate(db, estimate),
                LastUpdatedDB.updateUpdatedTimestamp(db, PORTCALL_ESTIMATES_DATA_TYPE, new Date(start))
            ];
            return t.batch(queries);
        });
    });
}

export async function findAllEstimates(
    locode?: string,
    mmsi?: number,
    imo?: number
): Promise<ApiEstimate[]> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any, any>) => {
        if (locode) {
            return EstimatesDB.findByLocode(db, locode!!);
        } else if (mmsi && !imo) {
            return EstimatesDB.findByMmsi(db, mmsi!!);
        } else if (imo) {
            return EstimatesDB.findByImo(db, imo!!);
        }
        throw new Error('No locode, mmsi or imo given');
    }).finally(() => {
        console.info("method=findAllEstimates tookMs=%d", (Date.now() - start));
    }).then((estimates: DbEstimate[]) => estimates.map(e => ({
        eventType: e.event_type,
        eventTime: e.event_time.toISOString(),
        recordTime:e.record_time.toISOString(),
        eventTimeConfidenceLower: e.event_time_confidence_lower,
        eventTimeConfidenceUpper: e.event_time_confidence_upper,
        source: e.event_source,
        ship: {
            mmsi: e.ship_mmsi,
            imo: e.ship_imo
        },
        location: {
            port: e.location_locode
        }
    })));
}