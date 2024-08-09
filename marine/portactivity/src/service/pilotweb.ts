import * as PilotwebAPI from "../api/pilotweb.js";
import * as PilotagesDAO from "../dao/pilotages.js";
import * as TimestampDAO from "../dao/timestamps.js";
import * as LocationConverter from "./location-converter.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { ApiTimestamp, Location } from "../model/timestamp.js";
import { EventType } from "../model/timestamp.js";
import type { Pilotage } from "../model/pilotage.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabase } from "@digitraffic/common/dist/database/database";
import { EventSource } from "../model/eventsource.js";

export async function getMessagesFromPilotweb(host: string, authHeader: string): Promise<ApiTimestamp[]> {
    const message = await PilotwebAPI.getMessages(host, authHeader);
    const pilotages = JSON.parse(message) as Pilotage[];

    logger.info({
        method: "PilotwebService.getMessagesFromPilotweb",
        customPilotagesReceivedCount: pilotages.length
    });

    return inDatabase(async (db: DTDatabase) => {
        const idMap = await PilotagesDAO.getTimestamps(db);
        const pilotageIds = await removeMissingPilotages(db, idMap, pilotages);
        const updated = await updateAllPilotages(db, idMap, pilotages);

        logger.debug({
            method: "PilotwebService.getMessagesFromPilotweb",
            message: `updated pilotages: ${JSON.stringify(updated)}`
        });
        logger.debug({
            method: "PilotwebService.getMessagesFromPilotweb",
            message: `timestamps to remove: ${JSON.stringify(pilotageIds)}`
        });

        await removeTimestamps(db, pilotageIds);

        return convertUpdatedTimestamps(db, updated);
    });
}

async function removeTimestamps(db: DTDatabase, pilotageIds: number[]): Promise<void> {
    if (pilotageIds.length > 0) {
        const sourceIds = pilotageIds.map((id) => id.toString());

        const timestampsRemoved = await TimestampDAO.removeTimestamps(db, EventSource.PILOTWEB, sourceIds);
        logger.info({
            method: "PilotwebService.removeTimestamps",
            message: `removed: ${JSON.stringify(timestampsRemoved)}`
        });
    }
}

async function updateAllPilotages(
    db: DTDatabase,
    idMap: PilotagesDAO.TimestampMap,
    pilotages: Pilotage[]
): Promise<Pilotage[]> {
    const newAndUpdated = findNewAndUpdated(idMap, pilotages);

    logger.info({
        method: "PilotwebService.updateAllPilotages",
        customPilotagesUpdatedCount: newAndUpdated.length
    });

    await PilotagesDAO.updatePilotages(db, newAndUpdated);

    return newAndUpdated;
}

async function removeMissingPilotages(
    db: DTDatabase,
    idMap: PilotagesDAO.TimestampMap,
    pilotages: Pilotage[]
): Promise<number[]> {
    const removedIds = findRemoved(idMap, pilotages);

    logger.info({
        method: "PilotwebService.removeMissingPilotages",
        customDeletedPilotagesCount: removedIds.length
    });

    await PilotagesDAO.deletePilotages(db, removedIds);

    return removedIds;
}

async function convertUpdatedTimestamps(db: DTDatabase, newAndUpdated: Pilotage[]): Promise<ApiTimestamp[]> {
    return (
        await Promise.all(
            newAndUpdated.map(async (p: Pilotage): Promise<ApiTimestamp | undefined> => {
                const base = createApiTimestamp(p);

                if (base) {
                    const location = LocationConverter.convertLocation(p.route);
                    const portcallId = await getPortCallId(db, p, location);

                    if (portcallId) {
                        return {
                            ...base,
                            ...{
                                recordTime: p.scheduleUpdated,
                                source: EventSource.PILOTWEB,
                                sourceId: p.id.toString(),
                                ship: {
                                    mmsi: p.vessel.mmsi,
                                    imo: p.vessel.imo
                                },
                                location,
                                portcallId
                            }
                        } as ApiTimestamp;
                    }

                    logger.info({
                        method: "PilotwebService.convertUpdatedTimestamps",
                        message: `skipping pilotage ${p.id}, missing portcallId`
                    });
                }
                return undefined;
            })
        )
    ).filter((x) => !!x);
}

function getPortCallId(db: DTDatabase, p: Pilotage, location: Location): Promise<number | undefined> {
    if (p.portnetPortCallId) {
        return Promise.resolve(p.portnetPortCallId);
    }

    logger.info({
        method: "PilotwebService.getPortCallId",
        message: `no portcallid from pilotage ${p.id}`
    });

    return PilotagesDAO.findPortCallId(db, p, location);
}

function createApiTimestamp(pilotage: Pilotage): Partial<ApiTimestamp> | undefined {
    const eventTime = getMaxDate(pilotage.vesselEta, pilotage.pilotBoardingTime).toISOString();

    if (pilotage.state === "ESTIMATE" || pilotage.state === "NOTICE") {
        return {
            eventType: EventType.RPS,
            eventTime
        };
    } else if (pilotage.state === "ORDER") {
        return {
            eventType: EventType.PPS,
            eventTime
        };
    } else if (pilotage.state === "ACTIVE") {
        return {
            eventType: EventType.APS,
            eventTime: pilotage.vesselEta
        };
    } else if (pilotage.state === "FINISHED") {
        return {
            eventType: EventType.APC,
            eventTime: pilotage.endTime
        };
    }

    return undefined;
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

    pilotages.forEach((p) => {
        const timestamp = idMap.get(p.id);
        const updatedPilotage = timestamp && timestamp.toISOString() !== p.scheduleUpdated;
        const newPilotage = !timestamp && p.state !== "FINISHED";

        if (updatedPilotage || newPilotage) {
            newAndUpdated.push(p);
        }
    });

    return newAndUpdated;
}

function findRemoved(idMap: PilotagesDAO.TimestampMap, pilotages: Pilotage[]): number[] {
    const pilotageSet = new Set<number>();
    const removed: number[] = [];

    // construct id-set from pilotages
    pilotages.forEach((p) => pilotageSet.add(p.id));

    [...idMap.keys()].forEach((id) => {
        if (!pilotageSet.has(id)) {
            removed.push(id);
        }
    });

    return removed;
}
