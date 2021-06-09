import * as PilotwebAPI from "../api/pilotweb";
import * as PilotagesDAO from "../db/pilotages";
import * as TimestampDAO from '../db/timestamps';
import * as LocationConverter from './location-converter';
import {TimestampMap} from "../db/pilotages";
import {ApiTimestamp, EventType, Location} from "../model/timestamp";
import {Pilotage} from "../model/pilotage";
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import {EVENTSOURCE_PILOTWEB} from "../event-sourceutil";

export async function getMessagesFromPilotweb(host: string, authHeader: string): Promise<ApiTimestamp[]> {
    const message = await PilotwebAPI.getMessages(host, authHeader);

    const pilotages = JSON.parse(message) as Pilotage[];

    console.log("method=PortActivity.GetMessages source=Pilotweb receivedCount=%d", pilotages.length);

    let updated = [] as Pilotage[];
    await inDatabase(async  (db: IDatabase<any, any>) => {
        const idMap = await PilotagesDAO.getTimestamps(db);
        const removed = await removeMissingPilotages(db, idMap, pilotages);
        updated = await updateAllPilotages(db, idMap, pilotages);

        console.info("timestamps to remove " + JSON.stringify(removed));

        const timestampsRemoved = await TimestampDAO.removeTimestamps(db, removed);
        console.log("removed " + timestampsRemoved);
    });

    return convertUpdatedTimestamps(updated);
}

async function updateAllPilotages(db: IDatabase<any, any>, idMap: TimestampMap, pilotages: Pilotage[]): Promise<Pilotage[]> {
    const newAndUpdated = findNewAndUpdated(idMap, pilotages);

    console.info("updatedCount=%d", newAndUpdated.length);

    await PilotagesDAO.updatePilotages(db, newAndUpdated);

    return newAndUpdated;
}

async function removeMissingPilotages(db: IDatabase<any, any>, idMap: TimestampMap, pilotages: Pilotage[]): Promise<any[]> {
    const removedIds = findRemoved(idMap, pilotages);

    console.info("deletedCount=%d", removedIds.length);

    return await PilotagesDAO.deletePilotages(db, removedIds);
}

function convertUpdatedTimestamps(newAndUpdated: Pilotage[]): ApiTimestamp[] {
    const timestamps = [] as ApiTimestamp[];

    newAndUpdated.forEach(p => {
        const base = createApiTimestamp(p);

        if(base) {
            const location = LocationConverter.convertLocation(p.route);

            timestamps.push({...base, ...{
                    recordTime: p.scheduleUpdated,
                    source: EVENTSOURCE_PILOTWEB,
                    sourceId: p.id.toString(),
                    ship: {
                        mmsi: p.vessel.mmsi,
                        imo: p.vessel.imo
                    },
                    location
                }});
        }
    });

    return timestamps;
}

function createApiTimestamp(pilotage: Pilotage): any {
    const eventTime = getMaxDate(pilotage.vesselEta, pilotage.pilotBoardingTime);

    if(pilotage.state === 'ESTIMATE' || pilotage.state === 'NOTICE') {
        return {
            eventType: EventType.RPS,
            eventTime
        };
    } else if(pilotage.state === 'ORDER') {
        return {
            eventType: EventType.PPS,
            eventTime
        };
    } else if(pilotage.state === 'ACTIVE') {
        return {
            eventType: EventType.APS,
            eventTime
        }
    } else if(pilotage.state === 'FINISHED') {
        return {
            eventType: EventType.APC,
            eventTime: pilotage.endTime
        }
    }

    return null;
}

function getMaxDate(date1string: string, date2string: string | undefined): Date {
    const date1 = new Date(date1string);

    if(date2string) {
        const date2 = new Date(date2string);

        if(date2.getTime() > date1.getTime()) {
            return date2;
        }
    }

    return date1;
}

function findNewAndUpdated(idMap: TimestampMap, pilotages: Pilotage[]): Pilotage[] {
    const newAndUpdated = [] as Pilotage[];

    pilotages.forEach(p => {
        const timestamp = idMap[p.id] as Date;
        const updatedPilotage = timestamp && timestamp.toISOString() !== p.scheduleUpdated;
        const newPilotage = !timestamp && p.state !== 'FINISHED';

        if(updatedPilotage || newPilotage) {
            newAndUpdated.push(p);
        }
    })

    return newAndUpdated;
}

function findRemoved(idMap: TimestampMap, pilotages: Pilotage[]): number[] {
    const pilotageMap = {} as any;
    const removed = [] as number[];

    // construct id-map from pilotages(id -> pilotage)
    pilotages.forEach(p => {
        pilotageMap[p.id] = p;
    })

    Object.keys(idMap).forEach(key => {
        const id = Number.parseInt(key);
        if(!pilotageMap[id]) {
            removed.push(id);
        }
    });

    return removed;
}
