import {
  getRandomInteger,
  getRandomIntegerAsString,
  getRandomNumber,
} from "@digitraffic/common/dist/test/testutils";
import type { GeoJsonLineString } from "@digitraffic/common/dist/utils/geojson-types";
import { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import { add } from "date-fns/add";
import { sub } from "date-fns/sub";
import type { Feature, Geometry, LineString, Point, Position } from "geojson";
import _ from "lodash";
import type {
  DbDomainContract,
  DbDomainTaskMapping,
  DbMaintenanceTracking,
} from "../model/db-data.js";
import type {
  ApiWorkevent,
  ApiWorkeventDevice,
  ApiWorkeventIoDevice,
} from "../model/paikannin-api-data.js";
import {
  PAIKANNIN_OPERATION_BRUSHING,
  PAIKANNIN_OPERATION_PAVING,
  PAIKANNIN_OPERATION_SALTING,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
} from "./testconstants.js";

export function createDbDomainContract(
  contract: string,
  domain: string,
  dataLastUpdated?: Date,
): DbDomainContract {
  return {
    contract: contract,
    data_last_updated: dataLastUpdated,
    domain: domain,
    start_date: add(new Date(), { days: -30 }),
    end_date: add(new Date(), { days: 30 }),
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
  geometry: GeoJsonPoint | GeoJsonLineString,
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
  ignore: boolean,
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
  distBetweenPointsM: number = 100,
): Position[] {
  // a = sqr(c^2/2)
  const distInXyKm = Math.sqrt((distBetweenPointsM / 1000) ** 2 / 2);
  const xAddition = KM_IN_X * distInXyKm;
  const yAddition = KM_IN_Y * distInXyKm;
  const x = getRandomNumber(X_MIN, X_MAX);
  const y = getRandomNumber(Y_MIN, Y_MAX);

  return Array.from({ length: coordinateCount }).map((_i, index) => {
    const even: boolean = index % 2 === 0;
    // Make linestring to go zigzag, so it won't be simplified
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
  distBetweenPointsM: number = 100,
): GeoJsonLineString {
  const coordinates: Position[] = createZigZagCoordinates(
    coordinateCount,
    distBetweenPointsM,
  );
  return createLineString(coordinates);
}

export function createLineStringGeometries(
  minCount: number,
  maxCount: number,
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

export function dateInPastMinutes(minutes: number): Date {
  return add(new Date(), { minutes: -1 * minutes });
}

export function addMinutes(reference: Date, minutes: number): Date {
  return add(reference, { minutes: minutes });
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
  ],
): ApiWorkeventDevice {
  // Update for every event + minute
  let eventTime = sub(endTime, { minutes: geometry.coordinates.length });
  const events: ApiWorkevent[] = geometry.coordinates.map((position) => {
    eventTime = add(eventTime, { minutes: 1 });
    return {
      deviceId: deviceId,
      heading: 0,
      lon: position[0]!,
      lat: position[1]!,
      speed: 10,
      altitude: position[2]!,
      deviceName: deviceId.toString(),
      timest: eventTime.toISOString(),
      ioChannels: _.cloneDeep(operations),
      timestamp: eventTime,
    };
  });

  return {
    deviceId: deviceId,
    deviceName: deviceId.toString(),
    workEvents: events,
  };
}

export function getRandompId(): string {
  return getRandomIntegerAsString(100000, 100000000000);
}
