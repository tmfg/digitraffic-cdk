import * as CommonDateUtils from "@digitraffic/common/dist/utils/date-utils";
import { GeoJsonLineString, GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import * as GeometryUtils from "@digitraffic/common/dist/utils/geometry";
import { type Feature, type Geometry, type LineString, type Position } from "geojson";
import sub from "date-fns/sub";
import {
    AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M,
    AUTORI_MAX_DISTANCE_WHEN_INFINITE_SPEED_M,
    AUTORI_MAX_MINUTES_TO_HISTORY,
    AUTORI_MAX_SPEED_BETWEEN_TRACKINGS_KMH,
    AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S
} from "../constants.js";
import { type ApiContractData, type ApiOperationData, type ApiRouteData } from "../model/autori-api-data.js";
import {
    type DbDomainContract,
    type DbDomainTaskMapping,
    type DbMaintenanceTracking,
    type DbWorkMachine
} from "../model/db-data.js";
import { UNKNOWN_TASK_NAME } from "../model/tracking-save-result.js";
import { createHarjaId, calculateSpeedInKmH } from "./utils.js";
import logger from "./maintenance-logger.js";

/**
 * This fixes:
 * - Removes big jumps from the data by splitting geometries in two or more geometries
 * - Just one geometry/ApiRouteData allowed -> will create multiple ApiRouteData objects from one if it contains multiple geometries
 * @param originalRouteData data to fix
 */
export function fixApiRouteDatas(originalRouteData: ApiRouteData[]): ApiRouteData[] {
    const sortedRouteData: ApiRouteData[] = originalRouteData
        .slice()
        .sort((a, b) =>
            CommonDateUtils.dateFromIsoString(a.startTime).getTime() <
            CommonDateUtils.dateFromIsoString(b.startTime).getTime()
                ? -1
                : 1
        );
    const fixedRouteData: ApiRouteData[] = [];
    sortedRouteData.forEach((routeData) => {
        const result = fixApiRouteData(routeData);
        fixedRouteData.push(...result);
    });
    return fixedRouteData;
}

function fixApiRouteData(routeData: ApiRouteData): ApiRouteData[] {
    if (!routeData.geography?.features) {
        return [];
    }

    try {
        const fixedFeatures: Feature[] = [];
        const features: Feature[] = routeData.geography.features;
        features.forEach((f) => {
            if (f.geometry.type === "Point") {
                fixedFeatures.push(f);
            } else if (f.geometry.type !== "LineString") {
                logger.error({
                    method: "AutoriUtils.fixApiRouteData",
                    message: `Not supported geometry type: ${f.geometry.type}`
                });
            } else {
                const newFeatures: Feature[] = groupFeaturesToIndividualGeometries(f);
                fixedFeatures.push(...newFeatures);
            }
        });
        return fixedFeatures.map((feature) => ({
            vehicleType: routeData.vehicleType,
            user: routeData.user,
            geography: {
                type: "FeatureCollection",
                features: [feature]
            },
            created: routeData.created,
            updated: routeData.updated,
            id: routeData.id,
            startTime: routeData.startTime,
            endTime: routeData.endTime,
            operations: routeData.operations
        }));
    } catch (error) {
        logger.error({ method: "AutoriUtils.fixApiRouteData", message: "failed", error });
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

        const geom = feature.geometry as LineString;
        const positionGroups: Position[][] = toPositionGroups(geom.coordinates.slice());

        const newFeatures = positionGroups.map((positions) => {
            const g: Geometry = positions.length === 1 && positions[0] ? new GeoJsonPoint(positions[0]) : new GeoJsonLineString(positions);
            return {
                type: "Feature",
                geometry: g
            } as Feature;
        });
        if (newFeatures.length > 1) {
            logger.info({
                method: "AutoriUtils.groupFeaturesToIndividualGeometries",
                message: `split feature: ${JSON.stringify(feature)} to ${JSON.stringify(newFeatures)}`
            });
        }
        return newFeatures;
    } catch (error) {
        logger.error({
            method: "AutoriUtils.groupFeaturesToIndividualGeometries",
            message: "failed",
            error
        });
        // On error keep original
        return [feature];
    }
}

/**
 * This modifies internally given sourceGeometry array, so don't reuse it after calling this method.
 * @param sourceGeometry
 * @param targetGeometries
 */
function toPositionGroups(sourceGeometry: Position[], targetGeometries: Position[][] = []): Position[][] {
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
        const prevLineString: Position[] | undefined = targetGeometries[targetGeometries.length - 1];
        const prevPosition: Position | undefined = prevLineString ? prevLineString[prevLineString.length - 1] : undefined;

        if (!prevLineString || !prevPosition) {
            // This should never happen as prevPosition, but just in case.
            // Not extending previous tracking -> create new linestring/point
            targetGeometries.push([nextPosition]);
        // Throw position to trash if it same as previous
        } else if (GeometryUtils.areDistinctPositions(prevPosition, nextPosition)) {
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

/**
 * @param previous time of previous tracking end time
 * @param next time of next tracking start time
 * @return true if next brefore is after previous and time limit is not over
 */
export function isOverTimeLimit(previous: Date, next: Date): boolean {
    const diff = CommonDateUtils.countDiffInSeconds(previous, next);
    return (
        diff < 0 || CommonDateUtils.countDiffInSeconds(previous, next) > AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S
    );
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
export function isExtendingPreviousTracking(
    previousPosition: Position,
    nextPosition: Position,
    previousTime?: Date,
    nextTime?: Date
): boolean {
    if (previousTime && nextTime && isOverTimeLimit(previousTime, nextTime)) {
        return false;
    }
    const distInM = GeometryUtils.distanceBetweenPositionsInM(previousPosition, nextPosition);
    const diffInS = previousTime && nextTime ? CommonDateUtils.countDiffInSeconds(previousTime, nextTime) : 0;
    const speedInKmH = previousTime && nextTime ? calculateSpeedInKmH(distInM, diffInS) : 0;
    if (distInM > AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M) {
        return false;
    } else if (isFinite(speedInKmH) && diffInS > 0 && speedInKmH > AUTORI_MAX_SPEED_BETWEEN_TRACKINGS_KMH) {
        return false;
    } else if (!isFinite(speedInKmH) && distInM > AUTORI_MAX_DISTANCE_WHEN_INFINITE_SPEED_M) {
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
    if (operations.length < 1) {
        return [];
    }

    return operations.reduce(function (filtered: string[], operation: string) {
        const taskMapping = taskMappings.find((mapping: DbDomainTaskMapping): boolean => {
            return mapping.original_id === operation && !mapping.ignore;
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
    const maxDate = sub(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY });

    let resolvedTime = sub(new Date(), { minutes: AUTORI_MAX_MINUTES_TO_HISTORY });
    if (contract.data_last_updated) {
        logger.debug(
            `method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${
                contract.domain
            } using contract.data_last_updated ${contract.data_last_updated.toISOString()}`
        );
        resolvedTime = contract.data_last_updated;
    } else if (contract.start_date) {
        logger.debug(
            `method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${
                contract.domain
            } using contract.start_date ${contract.start_date.toISOString()}`
        );
        resolvedTime = contract.start_date;
    } else {
        logger.debug(
            `method=AutoriUpdate.resolveContractLastUpdateTime contract=${contract.contract} and domain=${
                contract.domain
            } using -7, 'minutes' ${resolvedTime.toLocaleString()}`
        );
    }

    const result = new Date(Math.max(resolvedTime.getTime(), maxDate.getTime()));
    logger.debug(
        `method=AutoriUpdate.resolveContractLastUpdateTime resolvedTime=${resolvedTime.toISOString()} maxDate=${maxDate.toISOString()} result=${result.toISOString()} `
    );
    return result;
}

export function createDbWorkMachine(
    contractId: string,
    domainName: string,
    user: string,
    vehicleType?: string
): DbWorkMachine {
    return {
        harjaUrakkaId: createHarjaId(contractId),
        harjaId: createHarjaId(user + (vehicleType ?? "")),
        type: `domainName: ${domainName} / contractId: ${contractId} / user: ${user} vehicleType: ${
            vehicleType ?? ""
        }`
    };
}

export function createDbDomainContracts(
    contracts: ApiContractData[],
    domainName: string
): DbDomainContract[] {
    return contracts.map((contract) => ({
        domain: domainName,
        contract: contract.id,
        name: contract.name,
        start_date: contract.startDate ? CommonDateUtils.dateFromIsoString(contract.startDate) : undefined,
        end_date: contract.endDate ? CommonDateUtils.dateFromIsoString(contract.endDate) : undefined,
        data_last_updated: undefined,
        source: undefined
    }));
}

export function createDbDomainTaskMappings(
    operations: ApiOperationData[],
    domainName: string
): DbDomainTaskMapping[] {
    return operations.map((operation) => ({
        name: UNKNOWN_TASK_NAME,
        original_id: operation.id,
        // original_name: operation.operationName,
        domain: domainName,
        ignore: true
    }));
}

export function createDbMaintenanceTracking(
    workMachineId: number,
    routeData: ApiRouteData,
    contract: DbDomainContract,
    harjaTasks: string[]
): DbMaintenanceTracking | undefined {
    if (harjaTasks.length === 0) {
        logger.info({
            method: "AutoriUpdate.createDbMaintenanceTracking",
            message: `No tasks for tracking api id ${routeData.id} -> no data to save`,
            customDomain: contract.domain,
            customContract: contract.contract
        });
        return undefined;
    }

    if (!routeData.geography?.features) {
        logger.info({
            method: `AutoriUpdate.createDbMaintenanceTracking`,
            message: `no geography data: ${JSON.stringify(routeData)}`,
            customDomain: contract.domain,
            customContract: contract.contract
        });
        return undefined;
    }

    if (routeData.geography.features.length > 1) {
        logger.warn({
            method: `AutoriUpdate.createDbMaintenanceTracking`,
            message: `geography.features length bigger than 1 data: ${JSON.stringify(routeData)}`,
            customDomain: contract.domain,
            customContract: contract.contract
        });
    }

    const f = routeData.geography.features[0];
    let lastPoint: GeoJsonPoint;
    let geometry: GeoJsonPoint | GeoJsonLineString;
    if (!f) {
        throw new Error(`Undefined feature routeData.geography.features[0] geometry for ${JSON.stringify(routeData?.geography)}`);
    } else if (f.geometry.type === "Point") {
        lastPoint = new GeoJsonPoint(f.geometry.coordinates);
        geometry = lastPoint;
    } else if (f.geometry.type === "LineString") {
        const lastPos : Position | undefined = f.geometry.coordinates[f.geometry.coordinates.length - 1];
        if (lastPos) {
            lastPoint = new GeoJsonPoint(lastPos);
            geometry = new GeoJsonLineString(f.geometry.coordinates);
        } else {
            throw new Error(`Invalid LineString for maintenance tracking ${f.geometry.type} ${JSON.stringify(f.geometry.coordinates)}`);
        }
    } else {
        throw new Error(`Unsupported geometry type for maintenance tracking ${f.geometry.type}`);
    }

    return {
        direction: undefined,
        sending_time: CommonDateUtils.dateFromIsoString(routeData.created ?? new Date().toISOString()),
        start_time: CommonDateUtils.dateFromIsoString(routeData.startTime),
        end_time: CommonDateUtils.dateFromIsoString(routeData.endTime),
        last_point: lastPoint,
        geometry: geometry,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: harjaTasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: routeData.id,
        finished: false
    };
}
