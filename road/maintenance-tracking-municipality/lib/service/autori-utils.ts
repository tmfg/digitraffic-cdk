import * as GeometryUtils from "digitraffic-common/utils/geometry";
import {
    AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM,
    AUTORI_MAX_MINUTES_TO_HISTORY,
    AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS,
    MAX_SPEED_BETWEEN_TRACKINGS_KMH,
} from "../constants";
import {Feature, Geometry, LineString, Position} from "geojson";
import * as Utils from "./utils";
import {createHarjaId} from "./utils";
import {ApiContractData, ApiOperationData, ApiRouteData} from "../model/autori-api-data";
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geojson-types";
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking, DbWorkMachine} from "../model/db-data";
import moment from "moment";
import {UNKNOWN_TASK_NAME} from "../model/tracking-save-result";

/**
 * This fixes:
 * - Removes big jumps from the data by splitting geometries in two or more geometries
 * - Just one geometry/ApiRouteData allowed -> will create multiple ApiRouteData objects from one if it contains multiple geometries
 * @param originalRouteData data to fix
 */
export function fixApiRouteDatas(originalRouteData: ApiRouteData[]): ApiRouteData[] {

    const sortedRouteData: ApiRouteData[] = originalRouteData.slice()
        .sort((a,b) => (Utils.dateFromIsoString(a.startTime).getTime() < Utils.dateFromIsoString(b.startTime).getTime() ? -1 : 1));
    const fixedRouteData: ApiRouteData[] = [];
    sortedRouteData.forEach(routeData => {
        const result = fixApiRouteData(routeData);
        fixedRouteData.push(...result);
    });
    return fixedRouteData;
}

function fixApiRouteData(routeData: ApiRouteData): ApiRouteData[] {
    if (!routeData?.geography?.features) {
        return [];
    }

    try {
        const fixedFeatures: Feature[] = [];
        const features: Feature[] = routeData.geography.features;
        features.forEach(f => {
            if (f.geometry.type === "Point") {
                fixedFeatures.push(f);
            } else if (f.geometry.type !== "LineString") {
                console.error(`method=AutoriUtils.fixApiRouteData Not supported geometry type: ${f.geometry.type}`);
            } else {
                const newFeatures: Feature[] = groupFeaturesToIndividualGeometries(f);
                fixedFeatures.push(...newFeatures);
            }
        });
        return fixedFeatures.map(feature => (
            {
                vehicleType: routeData.vehicleType,
                user: routeData.user,
                geography: {
                    type: "FeatureCollection",
                    features: [feature],
                },
                created: routeData.created,
                updated: routeData.updated,
                id: routeData.id,
                startTime: routeData.startTime,
                endTime: routeData.endTime,
                operations: routeData.operations,
            }
        ));
    } catch (e) {
        console.error(`method=AutoriUtils.fixApiRouteData failed`, e);
        // On error keep original
        return [routeData];
    }
}

/**
 * Splits Feature to distinct features if it contains:
 * – Multiple geometries
 * - Geometry has jumps over the limit PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM between coordinates
 *
 * @param feature Feature to be fixed
 */
export function groupFeaturesToIndividualGeometries(feature: Feature): Feature[] {
    try {
        if (feature.geometry.type === "Point") {
            return [feature];
        }

        const geom = <LineString>feature.geometry;
        const positionGroups: Position[][] = toPositionGroups(geom.coordinates.slice());

        const newFeatures = positionGroups.map(positions => {
            const g: Geometry = positions.length == 1 ?
                new GeoJsonPoint(positions[0]) :
                new GeoJsonLineString(positions);
            return {
                type: "Feature",
                geometry: g,
            } as Feature;
        });
        if (newFeatures.length > 1) {
            console.info(`method=AutoriUtils.groupFeaturesToIndividualGeometries split feature: ${JSON.stringify(feature)} to ${JSON.stringify(newFeatures)}`);
        }
        return newFeatures;
    } catch (e) {
        console.error(`method=AutoriUtils.groupFeaturesToIndividualGeometries failed`, e);
        // On error keep original
        return [feature];
    }
}

/**
 * This modifies internally given sourceGeometry array, so don't reuse it after calling this method.
 * @param sourceGeometry
 * @param targetGeometries
 */
function toPositionGroups(sourceGeometry: Position[], targetGeometries:Position[][]=[]): Position[][] {
    // Check we have events in array
    if (!sourceGeometry.length) {
        return targetGeometries;
    }
    // Take first element away from start of the array
    // Here we modify the contents of sourceGeometry parameter array
    const nextPosition: Position | undefined = sourceGeometry.shift();
    if (!nextPosition) {
        return targetGeometries;
    }

    if (targetGeometries.length > 0) {
        // Take prev Position from groups and compare it to next
        const prevLineString: Position[] = targetGeometries[targetGeometries.length-1];
        const prevPosition: Position = prevLineString[prevLineString.length-1];

        // Throw position to trash if it same as previous
        if (GeometryUtils.areDistinctPositions(prevPosition, nextPosition)) {
            if (isExtendingPreviousTracking(prevPosition, nextPosition)) {
                prevLineString.push(nextPosition);
            } else {
                // Not extending previous tracking -> create new linestring/point
                targetGeometries.push([nextPosition]);
            }
        }
    } else {
        targetGeometries.push([nextPosition]); // create new group
    }
    return toPositionGroups(sourceGeometry, targetGeometries);
}

export function isOverTimeLimit(previous: Date, next: Date) {
    return Utils.countDiffMs(previous, next) > AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS;
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
export function isExtendingPreviousTracking(previousPosition: Position, nextPosition: Position, previousTime?: Date, nextTime? :Date): boolean {
    if (previousTime && nextTime && isOverTimeLimit(previousTime, nextTime)) {
        return false;
    }
    const distInKm = GeometryUtils.distanceBetweenPositionsInKm(previousPosition, nextPosition);
    const diffInMs = previousTime && nextTime ? Utils.countDiffMs(previousTime, nextTime) : 0;
    const speedInKmH = previousTime && nextTime ? Utils.calculateSpeedInKmH(distInKm, diffInMs) : 0;
    if (distInKm > AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM) {
        return false;
    } else if (isFinite(speedInKmH) && diffInMs > 0 && speedInKmH > MAX_SPEED_BETWEEN_TRACKINGS_KMH) {
        return false;
    } else if (!isFinite(speedInKmH) && distInKm > 0.05) {
        // Simplification/saving resolution to db might move location of previous tracking's end point a bit and then when comparing
        // it with next tracking's start point the result is infinity in speed. If point has moved significantly then consider as
        // discontinuation to previous point
        return false;
    }
    return true;
}

/**
 * Map domain route operations to Harja tasks
 * @param operations to map
 * @param taskMappings mapping of tasks from database
 */
export function getTasksForOperations(operations: string[], taskMappings: DbDomainTaskMapping[]): string[] {
    if (operations === undefined) {
        return [];
    }

    return operations.reduce(function (filtered: string[], operation) {
        const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
            return mapping.original_id == operation && !mapping.ignore;
        });
        if (taskMapping && !filtered.includes(taskMapping.name)) {
            return filtered.concat(taskMapping.name);
        }
        return filtered;
    }, []);
}

/**
 * Find out the start time from which data should be retrieved from api for the contract.
 *
 * @param contract for which the time should be resolved
 */
export function resolveNextStartTimeForDataFromApi(contract: DbDomainContract): Date {
    // Allowed to get last 5 min data, no further history, use max 7 min to have no gaps in data
    const maxDate = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();

    let resolvedTime = moment().subtract(AUTORI_MAX_MINUTES_TO_HISTORY, 'minutes').toDate();
    if (contract.data_last_updated) {
        console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.data_last_updated ${contract.data_last_updated.toISOString()}`);
        resolvedTime = contract.data_last_updated;
    } else if (contract.start_date) {
        console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using contract.start_date ${contract.start_date.toISOString()}`);
        resolvedTime = contract.start_date;
    } else {
        console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${contract.domain} using -7, 'minutes' ${resolvedTime.toLocaleString()}`);
    }

    const result = new Date(Math.max(resolvedTime.getTime(), maxDate.getTime()));
    console.debug(`DEBUG method=AutoriUpdate.resolveContractLastUpdateTime resolvedTime=${resolvedTime.toISOString()} maxDate=${maxDate.toISOString()}  result=${result.toISOString()} `);
    return result;
}

export function createDbWorkMachine(contractId: string, domainName: string, user: string, vehicleType?: string): DbWorkMachine {
    return {
        harjaUrakkaId: createHarjaId(contractId),
        harjaId: createHarjaId( user + (vehicleType ? vehicleType:'') ),
        type: `domainName: ${domainName} / contractId: ${contractId} / user: ${user} vehicleType: ${vehicleType}`,
    };
}

export function createDbDomainContracts(contracts: ApiContractData[], domainName: string): DbDomainContract[] {
    return contracts.map(contract => (
        /* eslint-disable camelcase */
        {
            domain: domainName,
            contract: contract.id,
            name: contract.name,
            start_date: contract.startDate ? Utils.dateFromIsoString(contract.startDate) : undefined,
            end_date: contract.endDate ? Utils.dateFromIsoString(contract.endDate) : undefined,
            data_last_updated: undefined,
            source: undefined,
            /* eslint-enable camelcase */
        }));
}

export function createDbDomainTaskMappings(operations: ApiOperationData[], domainName: string): DbDomainTaskMapping[] {
    return operations.map(operation => (
        /* eslint-disable camelcase */
        {
            name: UNKNOWN_TASK_NAME,
            original_id: operation.id,
            domain: domainName,
            ignore: true,
            /* eslint-enable camelcase */
        }));
}

export function createDbMaintenanceTracking(workMachineId: number, routeData: ApiRouteData, contract: DbDomainContract, harjaTasks: string[]): DbMaintenanceTracking|null {

    if (harjaTasks.length === 0) {
        console.info(`method=AutoriUpdate.createDbMaintenanceTracking domain=${contract.domain} contract=${contract.contract} No tasks for tracking api id ${routeData.id} -> no data to save`);
        return null;
    }

    if (!routeData.geography || !routeData.geography.features) {
        console.info(`method=AutoriUpdate.createDbMaintenanceTracking No geography domain=${contract.domain} contract=${contract.contract} data: ${JSON.stringify(routeData)}`);
        return null;
    }

    if (routeData.geography.features.length > 1) {
        console.warn(`method=AutoriUpdate.createDbMaintenanceTracking geography.features length bigger than 1 domain=${contract.domain} contract=${contract.contract} data: ${JSON.stringify(routeData)}`);
    }

    const f = routeData.geography.features[0];
    let lastPoint: GeoJsonPoint;
    let lineString: GeoJsonLineString | null = null;

    if (f.geometry.type == "Point") {
        lastPoint = new GeoJsonPoint(f.geometry.coordinates);
    } else if (f.geometry.type == "LineString") {
        lastPoint = new GeoJsonPoint(f.geometry.coordinates[f.geometry.coordinates.length - 1]);
        lineString = new GeoJsonLineString(f.geometry.coordinates);
    } else {
        throw new Error(`Unsupported geometry type for maintenance tracking ${f.geometry.type}`);
    }

    /* eslint-disable camelcase */
    return {
        direction: undefined,
        sending_time: Utils.dateFromIsoString(routeData.created ?? new Date().toISOString()),
        start_time: Utils.dateFromIsoString(routeData.startTime),
        end_time: Utils.dateFromIsoString(routeData.endTime),
        last_point: lastPoint,
        line_string: lineString,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: harjaTasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: routeData.id,
        finished: false,
    };
    /* eslint-enable camelcase */
}