import * as PilotwebAPI from "../api/pilotweb";
import * as PilotagesDAO from "../db/pilotages";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {Pilotage} from "../model/pilotage";
import {inDatabase} from "digitraffic-cdk-common/postgres/database";
import {IDatabase} from "pg-promise";
import {TimestampMap} from "../db/pilotages";

export async function getMessagesFromPilotweb(host: string, authHeader: string): Promise<ApiTimestamp[]> {
    const message = await PilotwebAPI.getMessages(host, authHeader);

    const pilotages = JSON.parse(message) as Pilotage[];

    console.log("method=PortActivity.GetMessages source=Pilotweb receivedCount=%d", pilotages.length);

    const idMap = await inDatabase(async  (db: IDatabase<any, any>) => {
        return await PilotagesDAO.getTimestamps(db);
    });

    await removeMissingPilotages(idMap, pilotages);
    await updateAllPilotages(idMap, pilotages);

    return convertApiTimestamps(idMap, pilotages);
}

async function updateAllPilotages(idMap: TimestampMap, pilotages: Pilotage[]): Promise<any> {
    const newAndUpdated = findNewAndUpdated(idMap, pilotages);

    console.info("updatedCount=%d", newAndUpdated.length);

    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await PilotagesDAO.updatePilotages(db, newAndUpdated);
    });
}

async function removeMissingPilotages(idMap: TimestampMap, pilotages: Pilotage[]): Promise<any> {
    const removed = findRemoved(idMap, pilotages);

    console.info("deletedCount=%d", removed.length);
    console.info("removed " + JSON.stringify(removed));

    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await PilotagesDAO.deletePilotages(db, removed);
    });
}

function convertApiTimestamps(idMap: TimestampMap, pilotages: Pilotage[]): ApiTimestamp[] {
    const removed = findRemoved(idMap, pilotages);
    const newAndUpdated = findNewAndUpdated(idMap, pilotages);

    return [];
}

function findNewAndUpdated(idMap: TimestampMap, pilotages: Pilotage[]): Pilotage[] {
    const newAndUpdated = [] as Pilotage[];

    pilotages.forEach(p => {
        const timestamp = idMap[p.id];
        const finishedPilotage = !timestamp && p.state === 'FINISHED';
        const updatedPilotage = timestamp !== p.scheduleUpdated;

        if(!finishedPilotage && updatedPilotage) {
            newAndUpdated.push(p);
        }
    })

    return newAndUpdated;
}

function findRemoved(idMap: TimestampMap, pilotages: Pilotage[]): number[] {
    const pilotageMap = {} as any;
    const removed = [] as number[];

    // construct id-map
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

function convert(pilotage: Pilotage): ApiTimestamp {
    const eventType = getEventType(pilotage);
    const eventTime = getEventTime(pilotage);

    return {
        eventType,
        eventTime,
        recordTime: pilotage.scheduleUpdated,
        source: 'PILOTWEB',
        ship: {
            mmsi: pilotage.vessel.mmsi,
            imo: pilotage.vessel.imo
        },
        location: {
            port: pilotage.route.end.code,
            berth: pilotage.route.end.berth?.code,
        }
    }
}

function getEventType(pilotage: Pilotage): EventType {
    return pilotage.state == 'FINISHED' ? EventType.ATA : EventType.ETA;
}

function getEventTime(pilotage: Pilotage): string {
    if(pilotage.pilotBoardingTime) {
        const etAsDate = new Date(pilotage.endTime);
        const ebtAsDate = new Date(pilotage.pilotBoardingTime);

        if(ebtAsDate > etAsDate) return pilotage.pilotBoardingTime;
    }

    return pilotage.endTime;
}