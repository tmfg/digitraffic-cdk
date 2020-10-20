import * as EstimatesDB from '../db/db-estimates'
import {DbEstimate, DbETAShip} from '../db/db-estimates'
import {inDatabase} from 'digitraffic-lambda-postgres/database';
import {IDatabase} from 'pg-promise';
import {ApiEstimate} from '../model/estimate';

export interface UpdatedEstimate {
    readonly ship_mmsi: number
    readonly ship_imo: number
    readonly location_locode: string
}

export async function saveEstimate(estimate: ApiEstimate): Promise<UpdatedEstimate | null> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(_ => EstimatesDB.updateEstimate(db, estimate));
    });
}

export async function saveEstimates(estimates: ApiEstimate[]): Promise<Array<UpdatedEstimate | null>> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(t => t.batch(
            estimates.map(estimate => EstimatesDB.updateEstimate(db, estimate))
        ));
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
        console.info('method=findAllEstimates tookMs=%d', (Date.now() - start));
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
        },
        portcallId: e.portcall_id
    })));
}

export async function findETAShipsByLocode(locodes: string[]): Promise<DbETAShip[]> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return EstimatesDB.findETAsByLocodes(db, locodes);
    }).finally(() => {
        console.info('method=findETAShipsByLocode tookMs=%d', (Date.now() - start));
    });
}
