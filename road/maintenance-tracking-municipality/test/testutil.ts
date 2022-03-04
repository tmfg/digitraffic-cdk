/* eslint-disable camelcase */
import {DbDomainContract, DbDomainTaskMapping, DbMaintenanceTracking} from "../lib/model/db-data";
import moment from "moment";
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geometry";
import {LineString, Position} from "geojson";
import {getRandomNumber} from "digitraffic-common/test/testutils";
import {X_MAX, X_MIN, Y_MAX, Y_MIN} from "./testconstants";

export function createDbDomainContract(contract : string, domain : string, dataLastUpdated?:Date) : DbDomainContract {
    return {
        contract: contract,
        data_last_updated: dataLastUpdated,
        domain: domain,
        start_date: moment().subtract(30, 'days').toDate(),
        end_date: moment().add(30, 'days').toDate(),
        name: "Urakka 1",
        source: "Foo / Bar",
    };
}

export function createDbMaintenanceTracking(
    contract: DbDomainContract,
    workMachineId: bigint, startTime: Date, endTime: Date, harjaTasks: string[], lastPoint: GeoJsonPoint, lineString?: GeoJsonLineString,
) : DbMaintenanceTracking {
    return {
        direction: 0,
        sending_time: endTime,
        start_time: startTime,
        end_time: endTime,
        last_point: lastPoint,
        line_string: lineString ? lineString : null,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: harjaTasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: 'none',
        finished: false,
    };
}

export function createTaskMapping(domain : string, harjaTask : string, domainOperation : string, ignore : boolean) : DbDomainTaskMapping {
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
 * @param distBetweenPointsKm
 */
export function createCoordinates(coordinateCount: number, distBetweenPointsKm=0.1) : Position[]  {
    // a = sqr(c^2/2)
    const distInXyKm = Math.sqrt(Math.pow(distBetweenPointsKm, 2)/2);
    const xAddition = KM_IN_X*distInXyKm;
    const yAddition = KM_IN_Y*distInXyKm;
    const x = getRandomNumber(X_MIN, X_MAX);
    const y = getRandomNumber(Y_MIN, Y_MAX);
    return [...Array(coordinateCount).keys()].map((i, index) => {
        const even: boolean = index % 2 == 0;
        // Make linestring to go zigzag, so it wont be simplified
        const nextX = x + index * xAddition;
        const nextY = y + (even ? 0 : yAddition);
        return [nextX, nextY];
    });
}
/**
 * Creates a zigzag linestring with given point distance (accuracy ~10m)
 * @param coordinateCount How many coordinates to generate
 * @param distBetweenPointsKm (default 0,1 km)
 */
export function createLineStringGeometry(coordinateCount: number, distBetweenPointsKm=0.1) : LineString  {
    const coordinates: Position[] = createCoordinates(coordinateCount, distBetweenPointsKm);
    return createLineString(coordinates);
}


export function createLineStringGeometries(minCount: number, maxCount: number) : LineString[]  {
    return Array.from({length: getRandomNumber(minCount, maxCount)}, () => {
        return createLineString([
            [getRandomNumber(X_MIN, X_MAX), getRandomNumber(Y_MIN, Y_MAX)],
            [getRandomNumber(X_MIN, X_MAX), getRandomNumber(Y_MIN, Y_MAX)],
        ]);
    });
}


export function createLineString(coordinates: Position[]) : LineString {
    return {
        type: "LineString",
        coordinates: coordinates,
    };
}

