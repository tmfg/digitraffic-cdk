import {ApiWorkevent, ApiWorkeventIoDevice} from "../model/paikannin-api-data";
import {distanceBetweenPositionsInKm, GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geometry";
import {MAX_TIME_BETWEEN_TRACKINGS_MS, MAX_SPEED_BETWEEN_TRACKINGS_KMH, PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM} from "../constants";
import {Position} from "geojson";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking, DbWorkMachine} from "../model/db-data";
import {createHarjaId} from "./utils";


/**
 * Splits work events to groups by following rules:
 * – events have over 5 minutes between them
 * - events have over 0,5 km between them
 * - events have computational speed over 140.0 km/h
 * - events' tasks change
 * - events are not in chronological order
 *
 * @param events to handle
 * @param filterBeforeOrEquaTime if even time is this or before this, it will be ignored
 */
export function groupEventsToIndividualTrackings(events: ApiWorkevent[], filterBeforeOrEquaTime?: Date): ApiWorkevent[][] {
    const chunks : ApiWorkevent[][] = []; // initial array of arrays
    // ascending order
    // const ordered = events.sort((a, b) => (a.timestamp.getTime() < b.timestamp.getTime() ? -1 : 1));
    return toEventGroups(chunks, events, filterBeforeOrEquaTime);
}

/**
 * Havaintodataa (maintenance_tracking_observation_data) yhdistetään tai erotellaan erillisiksi suoritteiksi (maintenance_tracking) useiden ehtojen perusteella
 * - Havaintojen aikaleimojen väli > 5 min -> uusi suorite
 * - Pisteiden välinen etäisyys > 0,5 km -> uusi suorite
 * - Pisteiden välinen nopeus on >= 140.0 km/h -> uusi suorite
 * - Ajoneuvon tekemät tehtävät vaihtuvat -> uusi suorite
 * - Uuden havainnon aikaleima ennen edellistä  -> uusi suorite (voidaan yhdistää vain kronologisessa järjestyksessä olevat havainnot)
 * - Tarkastetaan muualla: - Siirtymäajo (ei tehtäviä (task) käynissä) -> ei tallenneta ollenkaan
 *
 * @param targetGroups
 * @param sourceEvents
 * @param filterBeforeOrEquaTime
 */
function toEventGroups(targetGroups: ApiWorkevent[][], sourceEvents: ApiWorkevent[], filterBeforeOrEquaTime?: Date): ApiWorkevent[][] {
    if (sourceEvents.length > 0) {
        // take fist element away from start of the array
        const nextEvent: ApiWorkevent | undefined = sourceEvents.shift();
        if (!nextEvent) {
            return targetGroups;
        }

        // if element is older than allowed throw it away
        if (filterBeforeOrEquaTime && nextEvent.timestamp.getTime() <= filterBeforeOrEquaTime.getTime() ) {
            return toEventGroups(targetGroups, sourceEvents, filterBeforeOrEquaTime);
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
            } else if (isExtendingPreviousTracking(prevPosition, nextPosition, prevTime, nextTime)) {
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
            return toEventGroups(targetGroups, sourceEvents, filterBeforeOrEquaTime);
        } else {
            targetGroups.push([nextEvent]); // nextChunk
            return toEventGroups(targetGroups, sourceEvents, filterBeforeOrEquaTime);
        }
    }
    return targetGroups;
}

export function isOverTimeLimit(previous: Date, next: Date) {
    return countDiffMs(previous, next) > MAX_TIME_BETWEEN_TRACKINGS_MS;
}

export function countDiffMs(previous: Date, next: Date): number {
    return next.getTime() - previous.getTime();
}

const DIVIDER_FOR_MS_TO_HOURS = 1000*60.0*60.0;

export function calculateSpeedInKmH(distanceKm:number, diffMs:number): number {
    const hours = diffMs / DIVIDER_FOR_MS_TO_HOURS;
    const speed = distanceKm / hours;
    return Number.isNaN(speed) ? 0 : speed;
}

function isSameTasks(ioChannels1: ApiWorkeventIoDevice[], ioChannels2: ApiWorkeventIoDevice[]): boolean {
    if (ioChannels1.length != ioChannels2.length) {
        return false;
    }
    const ioChannel1Strings = ioChennelsToStrings(ioChannels2);
    const ioChannel2Strings = ioChennelsToStrings(ioChannels2);
    return hasBothStringArraysSameValues(ioChannel1Strings, ioChannel2Strings);
}

export function hasBothStringArraysSameValues(a: string[], b: string[]): boolean {
    if (a.length === b.length) {
        const bSet = new Set(b);
        return a.every(value => bSet.has(value));
    }
    return false;
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

 */
export function isExtendingPreviousTracking(previousPosition: Position, nextPosition: Position, previousTime: Date, nextTime: Date): boolean {
    if (isOverTimeLimit(previousTime, nextTime)) {
        return false;
    }
    const distInKm = distanceBetweenPositionsInKm(previousPosition, nextPosition);
    const diffInMs = countDiffMs(previousTime, nextTime);
    const speedInKmH = calculateSpeedInKmH(distInKm, diffInMs);
    if (distInKm > PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM) {
        return false;
    } else if (speedInKmH > MAX_SPEED_BETWEEN_TRACKINGS_KMH) {
        return false;
    }
    return true;
}

export function getStartPosition(mt: DbMaintenanceTracking): Position {
    if (mt.line_string && mt.line_string.coordinates.length > 0) {
        return mt.line_string.coordinates[0];
    }
    return mt.last_point.coordinates;
}

export function createDbWorkMachine(domainName: string, deviceId: number, deviceName: string): DbWorkMachine {
    return {
        harjaUrakkaId: createHarjaId(domainName),
        harjaId: BigInt(deviceId),
        type: `domainName: ${domainName} / deviceId: ${deviceId} / deviceName: ${deviceName}`,
    };
}

export function areDistinctPositions(previous: Position, next: Position) {
    return previous[0] !== next[0] || previous[1] !== next[1];
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
    if (operations === undefined) {
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

export function createLineStringFromEvents(events: ApiWorkevent[]) : GeoJsonLineString|null {
    if (!events || events.length < 2) {
        return null;
    }
    const lineStringCoordinates: Position[] = events.reduce((coordinates: Position[], nextEvent) => {
        const nextCoordinate: Position = [nextEvent.lon, nextEvent.lat];
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
    workMachineId: bigint,
    events: ApiWorkevent[],
    taskMappings: DbDomainTaskMapping[]) : DbMaintenanceTracking | null {

    const tasks: string[] = getTasksForOperations(events[0].ioChannels, taskMappings);
    if (tasks.length === 0) {
        return null;
    }

    const firstEvent = events[0];
    // lastPoint
    const lastEvent = events[events.length-1];
    const lastPoint = new GeoJsonPoint([lastEvent.lon, lastEvent.lat]);
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