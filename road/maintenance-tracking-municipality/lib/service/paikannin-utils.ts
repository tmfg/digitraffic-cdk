import * as CommonDateUtils from "digitraffic-common/utils/date-utils";
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geojson-types";
import {distanceBetweenPositionsInM} from "digitraffic-common/utils/geometry";
import * as CommonUtils from "digitraffic-common/utils/utils";
import {Position} from "geojson";
import * as Constants from "../constants";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking, DbWorkMachine} from "../model/db-data";
import {ApiWorkevent, ApiWorkeventDevice, ApiWorkeventIoDevice} from "../model/paikannin-api-data";
import * as Utils from "./utils";

/**
 * Filtters ApiWorkeventDevice.workEvents those doesn't have valid operations that are mapped for domain.
 * @param devices devices with events to filter
 * @param taskMappings domain's task mappings
 */
export function filterEventsWithoutTasks(devices: ApiWorkeventDevice[], taskMappings: DbDomainTaskMapping[]): ApiWorkeventDevice[] {

    return devices.map(device => {
        return {
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            workEvents: device.workEvents
                .filter(we => {
                    const result = hasValidOperations(we.ioChannels, taskMappings);
                    if (!result) {
                        console.info(`method=PaikanninUtils.filterEventsWithoutTasks ${JSON.stringify(we.ioChannels)}`);
                    }
                    return result;
                }),
        };
    }).filter(device => device.workEvents.length > 0);
}


const MIN_DATE = new Date(-8640000000000000);

/**
 * Splits work events to groups/distinct trackings by following rules:
 * – events have over 5 minutes between them (PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_MS)
 * - events have over 0,5 km between them (PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM)
 * - events have computational speed over 140.0 km/h (PAIKANNIN_MAX_SPEED_BETWEEN_TRACKINGS_KMH)
 * - events' tasks change
 * - events are not in chronological order
 * This wont check if work is transition run or not
 *
 * @param events to handle
 * @param filterBeforeOrEquaTime if even time is this or before this, it will be ignored
 */
export function groupEventsToIndividualTrackings(events: ApiWorkevent[], filterBeforeOrEquaTime=MIN_DATE): ApiWorkevent[][] {
    // ascending order
    const ordered = events.slice().sort((a, b) => (a.timestamp.getTime() < b.timestamp.getTime() ? -1 : 1));
    return toEventGroups(ordered, filterBeforeOrEquaTime);
}

/**
 * This modifies internally given sourceEvents array, so don't reuse it after calling this method
 * @param sourceEvents
 * @param filterBeforeOrEquaTime
 * @param targetGroups
 */
function toEventGroups(sourceEvents: ApiWorkevent[], filterBeforeOrEquaTime: Date, targetGroups: ApiWorkevent[][]=[]): ApiWorkevent[][] {
    // Check we have events in array
    if (!sourceEvents.length) {
        return targetGroups;
    }
    // Take first element away from start of the array
    const nextEvent: ApiWorkevent | undefined = sourceEvents.shift();
    if (!nextEvent) {
        return targetGroups;
    }

    // If element is older than allowed throw it away
    if (filterBeforeOrEquaTime && nextEvent.timestamp.getTime() <= filterBeforeOrEquaTime.getTime() ) {
        return toEventGroups(sourceEvents, filterBeforeOrEquaTime, targetGroups);
    } else if (targetGroups.length > 0) {
        // Take prev event from groups and compare it to next
        const prevGroup: ApiWorkevent[] = targetGroups[targetGroups.length-1];
        const prevEvent: ApiWorkevent = prevGroup[prevGroup.length-1];

        const prevTime = prevEvent.timestamp;
        const nextTime = nextEvent.timestamp;

        const prevPosition: Position = [prevEvent.lon, prevEvent.lat];
        const nextPosition: Position = [nextEvent.lon, nextEvent.lat];
        // Not in chronological order
        if (prevTime.getTime() > nextTime.getTime()) {
            targetGroups.push([nextEvent]); // create new group form next event
        } else if (isExtendingPreviousTracking(
            prevPosition, nextPosition, prevTime, nextTime, isSameTasks(prevEvent.ioChannels, nextEvent.ioChannels),
        )) {
            // Check if is continuing same task or has changed task between points
            if (isSameTasks(prevEvent.ioChannels, nextEvent.ioChannels)) {
                prevGroup.push(nextEvent); // continue in previous group
            } else {
                // Create new group but append next point also as end point for previous point tracking
                const endEventClone: ApiWorkevent = cloneApiWorkeventWithNewTasks(nextEvent, prevEvent.ioChannels);
                prevGroup.push(endEventClone);
                targetGroups.push([nextEvent]); // This will be start of the newGroup
            }
        } else {
            // Not extending previous tracking -> create new group
            targetGroups.push([nextEvent]);
        }
        return toEventGroups(sourceEvents, filterBeforeOrEquaTime, targetGroups);
    } else {
        targetGroups.push([nextEvent]); // create new group
        return toEventGroups(sourceEvents, filterBeforeOrEquaTime, targetGroups);
    }
}

export function isOverTimeLimit(previous: Date, next: Date) {
    return CommonDateUtils.countDiffInSeconds(previous, next) > Constants.PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S;
}

export function isOverDistanceLimitInMeters(distanceInM: number) {
    return distanceInM > Constants.PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M;
}

function isSameTasks(ioChannels1: ApiWorkeventIoDevice[], ioChannels2: ApiWorkeventIoDevice[]): boolean {
    if (ioChannels1.length != ioChannels2.length) {
        return false;
    }
    const ioChannel1Strings = ioChennelsToStrings(ioChannels2);
    const ioChannel2Strings = ioChennelsToStrings(ioChannels2);
    return CommonUtils.bothArraysHasSameValues(ioChannel1Strings, ioChannel2Strings);
}

function ioChennelsToStrings(ioChannels : ApiWorkeventIoDevice[]): string[] {
    return ioChannels.reduce(function (previousValue: string[], ioChannel) {
        previousValue.concat(ioChannel.name);
        return previousValue;
    }, []);
}

/**
 * Checks limits between given points for
 * - time limit
 * - distance limit
 * - speed limit
 * NOTE! Not checking tasks
 *
 * @param previousPosition end position of previous tracking
 * @param nextPosition first position of next tracking
 * @param previousTime time of previous position
 * @param nextTime time of next position
 * @param sameTasksForDebug Parameter only for debugging. Logs also this value if value is given.
 */
export function isExtendingPreviousTracking(
    previousPosition: Position, nextPosition: Position, previousTime: Date, nextTime: Date, sameTasksForDebug?: boolean,
): boolean {
    if (isOverTimeLimit(previousTime, nextTime)) {
        console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE isOverTimeLimit: ${CommonDateUtils.countDiffInSeconds(previousTime, nextTime)}` +
                     ` > ${Constants.PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S}[s] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} ` +
                     `positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
        return false;
    }

    const distInM = distanceBetweenPositionsInM(previousPosition, nextPosition);

    if (isOverDistanceLimitInMeters(distInM)) {
        console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE isOverDistanceLimitInMeters ${distInM}[m] > ${Constants.PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M}[m] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
        return false;
    }

    const timeInSeconds = CommonDateUtils.countDiffInSeconds(previousTime, nextTime);
    const speedInKmH = Utils.calculateSpeedInKmH(distInM, timeInSeconds);

    // 1. Nopeus 65 - 50, etäisyy
    // Jos nopeus max-joku ja aika alle limitin x niin ok

    const DIST_550 = 550;
    const DIST_200 = 200;
    const DIST_50 = 50;

    // dist > 50 && Speed is over limit or infinite => split
    // dist > 550 m => split
    // dist 550-200 && speed < 25 km/h => split
    // dist 200-50 && speed < 5 km/h => split
    // dist <= 50 => ok
    if (distInM > DIST_50 && (speedInKmH > Constants.PAIKANNIN_MAX_SPEED_BETWEEN_TRACKINGS_KMH || !isFinite(speedInKmH))) {
        // GPS accuracy and simplification/saving resolution to db might move location a bit and then when comparing
        // it with next point the result is infinity/really high in speed. If point has moved significantly and speed is high
        // then consider as a break to previous point
        console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE distInM: ${distInM}[m] > ${DIST_50}[m] && speedInKmH: ${speedInKmH}[km/h] > ${Constants.PAIKANNIN_MAX_SPEED_BETWEEN_TRACKINGS_KMH}[km/h] for time: ${timeInSeconds}[s] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
        return false;
    } else if (distInM > DIST_550) {
        console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE distInM: ${distInM}[m] > ${DIST_550}[m] && && ${speedInKmH}[km/h] for time: ${(timeInSeconds)}[s] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
        return false;
    } else if (distInM > DIST_200) {
        if (speedInKmH < 20) {
            console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE distInM: ${distInM}[m] > ${DIST_200}[m] && ${speedInKmH}[km/h] < 25 for time: ${(timeInSeconds)}[s] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
            return false;
        }
    } else if (distInM > DIST_50) {
        if (speedInKmH < 5) {
            console.info(`method=PaikanninUtils.isExtendingPreviousTracking FALSE distInM: ${distInM}[m] > ${DIST_50}[m] && ${speedInKmH}[km/h] < 5 for time: ${(timeInSeconds)}[s] between: ${previousTime.toISOString()} –> ${nextTime.toISOString()} positions: ${JSON.stringify(previousPosition)} -> ${JSON.stringify(nextPosition)} ${getDebugForSameTasks(sameTasksForDebug)}`);
            return false;
        }
    }
    return true;
}

function getDebugForSameTasks(sameTasksForDebug?: boolean): string {
    if (sameTasksForDebug === undefined || sameTasksForDebug === null) {
        return "";
    }
    return `sameTasks: ${sameTasksForDebug}`;
}


export function getStartPosition(mt: DbMaintenanceTracking): Position {
    if (mt.line_string && mt.line_string.coordinates.length > 0) {
        return mt.line_string.coordinates[0];
    }
    return mt.last_point.coordinates;
}

export function createDbWorkMachine(domainName: string, deviceId: number, deviceName: string): DbWorkMachine {
    return {
        harjaUrakkaId: Utils.createHarjaId(domainName),
        harjaId: BigInt(deviceId),
        type: `domainName: ${domainName} / deviceId: ${deviceId} / deviceName: ${deviceName}`,
    };
}

function cloneApiWorkeventWithNewTasks(prevEvent: ApiWorkevent, ioChannels: ApiWorkeventIoDevice[]) {
    const ioChannelsClone: ApiWorkeventIoDevice[] = [];
    ioChannels.forEach(val => ioChannelsClone.push(Object.assign({}, val)));
    return {
        deviceId: prevEvent.deviceId,
        timest: prevEvent.timest,
        deviceName: prevEvent.deviceName,
        altitude: prevEvent.altitude,
        heading: prevEvent.heading,
        ioChannels: ioChannelsClone,
        lat: prevEvent.lat,
        lon: prevEvent.lon,
        speed: prevEvent.speed,
        timestamp: prevEvent.timestamp,
    };
}

/**
 * Map domain route operations to Harja tasks
 *
 * For paikannin we use ApiWorkeventIoDevice.name as original id as there can be different codes for every machine.
 *
 * @param operations ApiWorkeventIoDevices to map from
 * @param taskMappings mapping of tasks from database
 */
export function getTasksForOperations(operations: ApiWorkeventIoDevice[], taskMappings: DbDomainTaskMapping[]): string[] {
    if (!operations) {
        return [];
    }

    return operations.reduce(function (filtered: string[], operation) {
        const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
            return mapping.original_id == operation.name.trim() && !mapping.ignore;
        });
        if (taskMapping && !filtered.includes(taskMapping.name)) {
            return filtered.concat(taskMapping.name);
        }
        return filtered;
    }, []);
}

/**
 * Checks if operations contains valid mapped values.
 * @param operations to check.
 * @param taskMappings of domain.
 */
export function hasValidOperations(operations: ApiWorkeventIoDevice[], taskMappings: DbDomainTaskMapping[]): boolean {
    return getTasksForOperations(operations, taskMappings).length > 0;
}

export function createLineStringFromEvents(events: ApiWorkevent[]) : GeoJsonLineString|null {
    if (!events || events.length < 2) {
        return null;
    }
    const lineStringCoordinates: Position[] = events.reduce((coordinates: Position[], nextEvent) => {
        const nextCoordinate: Position = [nextEvent.lon, nextEvent.lat, nextEvent.altitude];
        if (coordinates.length > 0 ) {
            const previousCoordinate: Position = coordinates[coordinates.length-1];
            // Linestring points must differ from previous values
            if ( previousCoordinate[0] !=  nextCoordinate[0] || previousCoordinate[1] !=  nextCoordinate[1]) {
                coordinates.push(nextCoordinate);
            }
        } else {
            coordinates.push(nextCoordinate);
        }
        return coordinates;
    }, []);

    if (lineStringCoordinates.length > 1) {
        return new GeoJsonLineString(lineStringCoordinates);
    }
    return null;
}

export function createDbMaintenanceTracking(contract: DbDomainContract,
    workMachineId: number,
    events: ApiWorkevent[],
    taskMappings: DbDomainTaskMapping[]) : DbMaintenanceTracking | null {

    const tasks: string[] = getTasksForOperations(events[0].ioChannels, taskMappings);
    if (tasks.length === 0) {
        return null;
    }

    const firstEvent = events[0];
    // lastPoint
    const lastEvent = events[events.length-1];
    const lastPoint = new GeoJsonPoint([lastEvent.lon, lastEvent.lat, lastEvent.altitude]);
    const lineString = createLineStringFromEvents(events);

    return {
        // direction: 0,
        /* eslint-disable camelcase */
        sending_time: lastEvent.timestamp,
        start_time: firstEvent.timestamp,
        end_time: lastEvent.timestamp,
        last_point: lastPoint,
        line_string: lineString,
        direction: lastEvent.heading,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: tasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: 'none',
        finished: true,
        // This is additional meta data, not saved to eb but used to update previous tracking
        start_direction: lastEvent.heading,
        /* eslint-enable camelcase */
    };
}