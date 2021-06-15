import * as TimestampsDB from '../db/timestamps'
import {DbTimestamp, DbTimestampIdAndLocode, DbETAShip, DbUpdatedTimestamp} from '../db/timestamps'
import {inDatabase} from '../../../../common/postgres/database';
import {IDatabase} from 'pg-promise';
import {ApiTimestamp} from '../model/timestamp';
import {
    isPortnetTimestamp,
    mergeTimestamps,
} from "../event-sourceutil";
import {Port} from "./portareas";

export interface UpdatedTimestamp extends DbUpdatedTimestamp {
    readonly locodeChanged: boolean
}

export async function saveTimestamp(timestamp: ApiTimestamp): Promise<UpdatedTimestamp> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(async t => {
            return doSaveTimestamp(t, timestamp);
        });
    });
}

export async function saveTimestamps(timestamps: ApiTimestamp[]): Promise<Array<DbUpdatedTimestamp | null>> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await db.tx(t => t.batch(
            timestamps.map(timestamp => doSaveTimestamp(t, timestamp))
        ));
    });
}

async function doSaveTimestamp(
    tx: any,
    timestamp: ApiTimestamp
): Promise<UpdatedTimestamp | null> {
    const removedTimestamps = await removeOldTimestamps(tx, timestamp);
    const updatedTimestamp = await TimestampsDB.updateTimestamp(tx, timestamp);
    return updatedTimestamp ? { ...updatedTimestamp, locodeChanged: removedTimestamps.length > 0 } : null
}

async function removeOldTimestamps(
    tx: any,
    timestamp: ApiTimestamp
): Promise<DbTimestampIdAndLocode[]> {
    let timestampsAnotherLocode: DbTimestampIdAndLocode[] = [];
    if (isPortnetTimestamp(timestamp)) {
        timestampsAnotherLocode = await TimestampsDB.findPortnetTimestampsForAnotherLocode(
            tx,
            timestamp.portcallId!,
            timestamp.location.port
        );
        if (timestampsAnotherLocode.length) {
            console.log(`method=doSaveTimestamp deleting timestamps with changed locode,timestamp ids: ${timestampsAnotherLocode.map(e => e.id)}`);
            await tx.batch(timestampsAnotherLocode.map(e => TimestampsDB.deleteById(tx, e.id)));
        }
    }
    return timestampsAnotherLocode;
}

export async function findAllTimestamps(
    locode?: string,
    mmsi?: number,
    imo?: number
): Promise<ApiTimestamp[]> {
    const start = Date.now();
    const timestamps: ApiTimestamp[] = await inDatabase(async (db: IDatabase<any, any>) => {
        if (locode) {
            return TimestampsDB.findByLocode(db, locode!!);
        } else if (mmsi && !imo) {
            return TimestampsDB.findByMmsi(db, mmsi!!);
        } else if (imo) {
            return TimestampsDB.findByImo(db, imo!!);
        }
        throw new Error('No locode, mmsi or imo given');
    }).finally(() => {
        console.info('method=findAllTimestamps tookMs=%d', (Date.now() - start));
    }).then((timestamps: DbTimestamp[]) => timestamps.map(e => ({
        eventType: e.event_type,
        eventTime: e.event_time.toISOString(),
        recordTime:e.record_time.toISOString(),
        eventTimeConfidenceLower: e.event_time_confidence_lower,
        eventTimeConfidenceUpper: e.event_time_confidence_upper,
        source: e.event_source,
        sourceId: e.source_id,
        ship: {
            mmsi: e.ship_mmsi,
            imo: e.ship_imo
        },
        location: {
            port: e.location_locode,
            portArea: e.location_portarea,
            from: e.location_from_locode
        },
        portcallId: e.portcall_id
    })));
    return mergeTimestamps(timestamps) as ApiTimestamp[];
}

export async function findETAShipsByLocode(
    locodes: string[],
    ports: Port[]): Promise<DbETAShip[]> {

    console.info("find for " + locodes);

    const startFindPortnetETAsByLocodes = Date.now();
    const portnetShips = await inDatabase(async (db: IDatabase<any, any>) => {
        return TimestampsDB.findPortnetETAsByLocodes(db, locodes);
    }).finally(() => {
        console.info('method=findPortnetETAsByLocodes tookMs=%d', (Date.now() - startFindPortnetETAsByLocodes));
    }) as DbETAShip[];

    if (portnetShips.length) {
        const startFindVtsShipsTooCloseToPort = Date.now();
        return await inDatabase(async (db: IDatabase<any, any>) => {
            const shipsTooCloseToPortImos =
                (await TimestampsDB.findVtsShipImosTooCloseToPortByPortCallId(
                    db,
                    portnetShips.map(s => s.portcall_id),
                    ports))
                .map(s => s.imo);
            console.log('method=findETAShipsByLocode Ships too close to port', shipsTooCloseToPortImos);
            const filteredShips = portnetShips.filter(s => shipsTooCloseToPortImos.includes(s.imo));
            console.log('method=findETAShipsByLocode Did not fetch ETA for ships too close to port', filteredShips);
            return portnetShips.filter(s => !shipsTooCloseToPortImos.includes(s.imo));
        }).finally(() => {
            console.info('method=startFindVtsShipsTooCloseToPort tookMs=%d', (Date.now() - startFindVtsShipsTooCloseToPort));
        }) as DbETAShip[];
    } else {
        return Promise.resolve([]);
    }
}
