import {
    getRandomInteger,
    getRandomNumber,
} from "@digitraffic/common/dist/test/testutils";
import {
    GeoJsonLineString,
    GeoJsonPoint,
} from "@digitraffic/common/dist/utils/geojson-types";
import { Feature, Geometry, LineString, Point, Position } from "geojson";
import { cloneDeep } from "lodash";
import moment from "moment";
import {
    DbDomainContract,
    DbDomainTaskMapping,
    DbMaintenanceTracking,
} from "../lib/model/db-data";
import {
    ApiWorkevent,
    ApiWorkeventDevice,
    ApiWorkeventIoDevice,
} from "../lib/model/paikannin-api-data";
import {
    PAIKANNIN_OPERATION_BRUSHING,
    PAIKANNIN_OPERATION_PAVING,
    PAIKANNIN_OPERATION_SALTING,
    X_MAX,
    X_MIN,
    Y_MAX,
    Y_MIN,
} from "./testconstants";

export function createDbDomainContract(
    contract: string,
    domain: string,
    dataLastUpdated?: Date
): DbDomainContract {
    return {
        contract: contract,
        data_last_updated: dataLastUpdated,
        domain: domain,
        start_date: moment().subtract(30, "days").toDate(),
        end_date: moment().add(30, "days").toDate(),
        name: "Urakka 1",
        source: "Foo / Bar",
    };
}

export function createDbMaintenanceTracking(
    contract: DbDomainContract,
    workMachineId: number,
    startTime: Date,
    endTime: Date,
    harjaTasks: string[],
    lastPoint: GeoJsonPoint,
    geometry: GeoJsonPoint | GeoJsonLineString
): DbMaintenanceTracking {
    return {
        direction: 0,
        sending_time: endTime,
        start_time: startTime,
        end_time: endTime,
        last_point: lastPoint,
        geometry: geometry,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: harjaTasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: "none",
        finished: false,
    };
}

export function createTaskMapping(
    domain: string,
    harjaTask: string,
    domainOperation: string,
    ignore: boolean
): DbDomainTaskMapping {
    return {
        name: harjaTask,
        domain: domain,
        ignore: ignore,
        original_id: domainOperation,
    };
}

const KM_IN_X = 0.017461264564;
const KM_IN_Y = 0.00899321606;

/**
 * Creates a zigzag of coordinates with given point distance (accuracy ~10m)
 * @param coordinateCount
 * @param distBetweenPointsM
 */
export function createZigZagCoordinates(
    coordinateCount: number,
    distBetweenPointsM = 100
): Position[] {
    // a = sqr(c^2/2)
    const distInXyKm = Math.sqrt(Math.pow(distBetweenPointsM / 1000, 2) / 2);
    const xAddition = KM_IN_X * distInXyKm;
    const yAddition = KM_IN_Y * distInXyKm;
    const x = getRandomNumber(X_MIN, X_MAX);
    const y = getRandomNumber(Y_MIN, Y_MAX);
    return Array.from({ length: coordinateCount }).map((i, index) => {
        const even: boolean = index % 2 == 0;
        // Make linestring to go zigzag, so it wont be simplified
        const nextX = x + index * xAddition;
        const nextY = y + (even ? 0 : yAddition);
        return [nextX, nextY, 0.5];
    });
}
/**
 * Creates a zigzag linestring with given point distance (accuracy ~10m)
 * @param coordinateCount How many coordinates to generate
 * @param distBetweenPointsM (default 100 m)
 */
export function createLineStringGeometry(
    coordinateCount: number,
    distBetweenPointsM = 100
): GeoJsonLineString {
    const coordinates: Position[] = createZigZagCoordinates(
        coordinateCount,
        distBetweenPointsM
    );
    return createLineString(coordinates);
}

export function createLineStringGeometries(
    minCount: number,
    maxCount: number
): LineString[] {
    return Array.from({ length: getRandomNumber(minCount, maxCount) }, () => {
        return createLineStringGeometry(getRandomInteger(2, 10), 100);
    });
}

export function createLineString(coordinates: Position[]): GeoJsonLineString {
    return {
        type: "LineString",
        coordinates: coordinates,
    };
}

export function createFeature(geometry: Geometry): Feature {
    return {
        type: "Feature",
        geometry: geometry,
    } as Feature;
}

export function dateInPastMinutes(minutes: number) {
    return moment().subtract(minutes, "minutes").toDate();
}

export function addMinutes(reference: Date, minutes: number) {
    return moment(reference).add(minutes, "minutes").toDate();
}

export function createGeoJSONPoint(xyz: Position): Point {
    return new GeoJsonPoint(xyz);
}

export function createApiRouteDataForEveryMinute(
    deviceId: number,
    endTime: Date,
    geometry: LineString,
    operations: ApiWorkeventIoDevice[] = [
        PAIKANNIN_OPERATION_BRUSHING,
        PAIKANNIN_OPERATION_PAVING,
        PAIKANNIN_OPERATION_SALTING,
    ]
): ApiWorkeventDevice {
    // Update for every event + minute
    const timeMoment = moment(endTime).subtract(
        geometry.coordinates.length,
        "minutes"
    );
    const events: ApiWorkevent[] = geometry.coordinates.map((position) => {
        timeMoment.add(1, "minutes");
        return {
            deviceId: deviceId,
            heading: 0,
            lon: position[0],
            lat: position[1],
            speed: 10,
            altitude: position[2],
            deviceName: deviceId.toString(),
            timest: timeMoment.toISOString(),
            ioChannels: cloneDeep(operations),
            timestamp: timeMoment.toDate(),
        };
    });

    return {
        deviceId: deviceId,
        deviceName: deviceId.toString(),
        workEvents: events,
    };
}
