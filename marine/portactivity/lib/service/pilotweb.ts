import * as PilotwebAPI from "../api/pilotweb";
import * as PilotagesDAO from "../dao/pilotages";
import * as TimestampDAO from '../dao/timestamps';
import * as LocationConverter from './location-converter';

import {ApiTimestamp, EventType, Location} from "../model/timestamp";
import {Pilotage} from "../model/pilotage";
import {inDatabase, DTDatabase} from "@digitraffic/common/database/database";
import {EventSource} from "../model/eventsource";

export async function getMessagesFromPilotweb(host: string, authHeader: string): Promise<ApiTimestamp[]> {
    const message = await PilotwebAPI.getMessages(host, authHeader);
    const pilotages = JSON.parse(message) as Pilotage[];

    console.log("method=PortActivity.GetMessages source=Pilotweb receivedCount=%d", pilotages.length);

    return inDatabase(async (db: DTDatabase) => {
        const idMap = await PilotagesDAO.getTimestamps(db);
        const pilotageIds = await removeMissingPilotages(db, idMap, pilotages);
        const updated = await updateAllPilotages(db, idMap, pilotages);

        console.info("DEBUG timestamps to remove " + JSON.stringify(pilotageIds));

        await removeTimestamps(db, pilotageIds);

        return convertUpdatedTimestamps(db, updated);
    });
}

async function removeTimestamps(db: DTDatabase, pilotageIds: number[]) {
    if (pilotageIds.length > 0) {
        const sourceIds = pilotageIds.map(id => id.toString());

        const timestampsRemoved = await TimestampDAO.removeTimestamps(db, EventSource.PILOTWEB, sourceIds);
        console.log("DEBUG removed %s", timestampsRemoved);
    }
}

async function updateAllPilotages(db: DTDatabase, idMap: PilotagesDAO.TimestampMap, pilotages: Pilotage[]): Promise<Pilotage[]> {
    const newAndUpdated = findNewAndUpdated(idMap, pilotages);

    console.info("updatedCount=%d", newAndUpdated.length);

    await PilotagesDAO.updatePilotages(db, newAndUpdated);

    return newAndUpdated;
}

async function removeMissingPilotages(db: DTDatabase, idMap: PilotagesDAO.TimestampMap, pilotages: Pilotage[]): Promise<number[]> {
    const removedIds = findRemoved(idMap, pilotages);

    console.info("deletedCount=%d", removedIds.length);

    await PilotagesDAO.deletePilotages(db, removedIds);

    return removedIds;
}

async function convertUpdatedTimestamps(db: DTDatabase, newAndUpdated: Pilotage[]): Promise<ApiTimestamp[]> {
    return (await Promise.all(newAndUpdated.map(async (p: Pilotage): Promise<ApiTimestamp | null> => {
        const base = createApiTimestamp(p);

        if (base) {
            const location = LocationConverter.convertLocation(p.route);
            const portcallId = await getPortCallId(db, p, location);

            if (portcallId) {
                return {
                    ...base, ...{
                        recordTime: p.scheduleUpdated,
                        source: EventSource.PILOTWEB,
                        sourceId: p.id.toString(),
                        ship: {
                            mmsi: p.vessel.mmsi,
                            imo: p.vessel.imo,
                        },
                        location,
                        portcallId,
                    },
                } as ApiTimestamp;
            }

            console.info("skipping pilotage %d, missing portcallId", p.id);
        }
        return null;
    }))).filter(x => x != null) as ApiTimestamp[];
}

function getPortCallId(db: DTDatabase, p: Pilotage, location: Location): Promise<number | null> {
    if (p.portnetPortCallId) {
        return Promise.resolve(p.portnetPortCallId);
    }

    console.info("no portcallid from pilotage %d", p.id);

    return PilotagesDAO.findPortCallId(db, p, location);
}

function createApiTimestamp(pilotage: Pilotage): Partial<ApiTimestamp> | null {
    const eventTime = getMaxDate(pilotage.vesselEta, pilotage.pilotBoardingTime).toISOString();

    if (pilotage.state === 'ESTIMATE' || pilotage.state === 'NOTICE') {
        return {
            eventType: EventType.RPS,
            eventTime,
        };
    } else if (pilotage.state === 'ORDER') {
        return {
            eventType: EventType.PPS,
            eventTime,
        };
    } else if (pilotage.state === 'ACTIVE') {
        return {
            eventType: EventType.APS,
            eventTime: pilotage.vesselEta,
        };
    } else if (pilotage.state === 'FINISHED') {
        return {
            eventType: EventType.APC,
            eventTime: pilotage.endTime,
        };
    }

    return null;
}

function getMaxDate(date1string: string, date2string: string | undefined): Date {
    const date1 = new Date(date1string);

    if (date2string) {
        const date2 = new Date(date2string);

        if (date2.getTime() > date1.getTime()) {
            return date2;
        }
    }

    return date1;
}

function findNewAndUpdated(idMap: PilotagesDAO.TimestampMap, pilotages: Pilotage[]): Pilotage[] {
    const newAndUpdated = [] as Pilotage[];

    pilotages.forEach(p => {
        const timestamp = idMap.get(p.id);
        const updatedPilotage = timestamp && timestamp.toISOString() !== p.scheduleUpdated;
        const newPilotage = timestamp == undefined && p.state !== 'FINISHED';

        if (updatedPilotage || newPilotage) {
            newAndUpdated.push(p);
        }
    });

    return newAndUpdated;
}

function findRemoved(idMap: PilotagesDAO.TimestampMap, pilotages: Pilotage[]): number[] {
    const pilotageSet: Set<number> = new Set();
    const removed = [] as number[];

    // construct id-set from pilotages
    pilotages.forEach(p => pilotageSet.add(p.id));

    Object.keys(idMap).forEach(key => {
        const id = Number.parseInt(key);
        if (!pilotageSet.has(id)) {
            removed.push(id);
        }
    });

    return removed;
}
