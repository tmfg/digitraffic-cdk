import type {
  RtzSchedule,
  RtzSchedules,
  RtzVoyagePlan,
  RtzWaypoint,
} from "@digitraffic/common/dist/marine/rtz";
import { isAfter, isValid } from "date-fns";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import { TZDate } from "@date-fns/tz";

// roughly the Gulf of Finland, Bothnian Sea/Bay and Northern Baltic
const SPATIAL_LIMITS = polygon([
  [
    [20.84, 68.82],
    [16.89, 61.7],
    [20.05, 58.01],
    [21.9, 58.62],
    [23.56, 59.02],
    [28.08, 59.23],
    [30.72, 59.59],
    [32.35, 63.1],
    [30.99, 67.94],
    [29.62, 70.4],
    [26.68, 71.28],
    [21.05, 69.78],
    [20.84, 68.82],
  ],
]);

export enum ValidationError {
  EMPTY_VOYAGE_PLAN = "Empty or null voyage plan",
  MISSING_ROUTE = "Missing route element",

  // waypoints structure
  MISSING_WAYPOINTS = "Missing route waypoints",
  MISSING_WAYPOINT = "Missing waypoint element",
  MISSING_POSITION = "Missing position element",
  NO_POSITION_ATTRIBUTES = "No attributes in position element",
  MISSING_LONGITUDE = "Missing longitude attribute",
  MISSING_LATITUDE = "Missing latitude attribute",

  // waypoints content
  COORDINATE_OUTSIDE_SPATIAL_LIMITS = "Coordinate(s) outside spatial limits",

  // schedules
  MISSING_SCHEDULES = "Missing route schedules",
  MISSING_SCHEDULE = "Missing schedule element",
  MISSING_SCHEDULE_ELEMENT = "Missing scheduleElement element",
  NO_SCHEDULE_ELEMENT_ATTRIBUTES = "No attributes in scheduleElement",
  NO_ETA_OR_ETD_ATTRIBUTES = "No ETA or ETD attribute in scheduleElement",

  // schedules content
  NO_FUTURE_TIMESTAMPS = "No timestamps set in the future",
}

export function validateStructure(
  voyagePlan?: RtzVoyagePlan,
): ValidationError[] {
  if (!voyagePlan) {
    return [ValidationError.EMPTY_VOYAGE_PLAN];
  }
  if (!voyagePlan.route) {
    return [ValidationError.MISSING_ROUTE];
  }

  return validateWaypointsStructure(voyagePlan.route.waypoints).concat(
    validateSchedulesStructure(voyagePlan.route.schedules),
  );
}

export function validateWaypointsStructure(
  wps?: RtzWaypoint[],
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  if (!wps || !wps.length) {
    return [ValidationError.MISSING_WAYPOINTS];
  }

  wps.forEach((wp) => {
    const w = wp.waypoint;
    if (!w || !w.length) {
      validationErrors.push(ValidationError.MISSING_WAYPOINT);
      return;
    }
    w.forEach((wpElem) => {
      const pos = wpElem.position;
      if (!pos || !pos.length) {
        validationErrors.push(ValidationError.MISSING_POSITION);
        return;
      }
      pos.forEach((p) => {
        const posAttrs = p.$;
        if (!posAttrs) {
          validationErrors.push(ValidationError.NO_POSITION_ATTRIBUTES);
          return;
        }
        const lon = posAttrs.lon;
        if (!lon) {
          validationErrors.push(ValidationError.MISSING_LONGITUDE);
        }
        const lat = posAttrs.lat;
        if (!lat) {
          validationErrors.push(ValidationError.MISSING_LATITUDE);
        }
      });
    });
  });

  return validationErrors;
}

export function validateSchedulesStructure(
  schedules?: RtzSchedules[],
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  if (!schedules || !schedules.length) {
    logger.warn({
      method: "VoyagePlansService.validateSchedulesStructure",
      message: "No schedules element",
    });

    return [];
  }

  schedules.forEach((scheds) => {
    if (!scheds) {
      logger.warn({
        method: "VoyagePlansService.validateSchedulesStructure",
        message: "No schedule element",
      });

      return;
    }
    if (!scheds.schedule || !scheds.schedule.length) {
      //validationErrors.push(ValidationError.MISSING_SCHEDULE);
      return;
    }
    scheds.schedule.forEach((sched) => {
      if (sched.calculated && sched.calculated.length) {
        sched.calculated.forEach((s) => {
          if (!s.scheduleElement || !s.scheduleElement.length) {
            logger.warn({
              method: "VoyagePlansService.validateSchedulesStructure",
              message: "Missing schedule element",
            });

            //    validationErrors.push(ValidationError.MISSING_SCHEDULE_ELEMENT);
            return;
          }
          s.scheduleElement.forEach((se) => {
            if (!se.$) {
              logger.warn({
                method: "VoyagePlansService.validateSchedulesStructure",
                message: "No schedule element attributes",
              });
              //      validationErrors.push(ValidationError.NO_SCHEDULE_ELEMENT_ATTRIBUTES);
              return;
            }
            if (!se.$.eta && !se.$.etd) {
              logger.warn({
                method: "VoyagePlansService.validateSchedulesStructure",
                message: "No schedule ETA/ETD attributes",
              });
              //    validationErrors.push(ValidationError.NO_ETA_OR_ETD_ATTRIBUTES);
            }
          });
        });
      } else if (sched.manual && sched.manual.length) {
        sched.manual.forEach((s) => {
          if (!s.scheduleElement || !s.scheduleElement.length) {
            logger.warn({
              method: "VoyagePlansService.validateSchedulesStructure",
              message: "Missing schedule element",
            });
            //validationErrors.push(ValidationError.MISSING_SCHEDULE_ELEMENT);
            return;
          }
          s.scheduleElement.forEach((se) => {
            if (!se.$) {
              logger.warn({
                method: "VoyagePlansService.validateSchedulesStructure",
                message: "No schedule element attributes",
              });
              //  validationErrors.push(ValidationError.NO_SCHEDULE_ELEMENT_ATTRIBUTES);
              return;
            }
          });
        });
      }
    });
  });

  return validationErrors;
}

export function validateContent(voyagePlan: RtzVoyagePlan): ValidationError[] {
  return validateWaypointsContent(voyagePlan.route.waypoints).concat(
    validateSchedulesContent(voyagePlan.route.schedules),
  );
}

export function validateWaypointsContent(
  wps: RtzWaypoint[],
): ValidationError[] {
  const validationErrors: ValidationError[] = [];
  if (wps.length) {
    if (!anyWayPointInsideSpatialLimits(wps)) {
      validationErrors.push(ValidationError.COORDINATE_OUTSIDE_SPATIAL_LIMITS);
    }
  }
  return validationErrors;
}

function anyWayPointInsideSpatialLimits(rtzWaypoints: RtzWaypoint[]): boolean {
  const points = rtzWaypoints.flatMap((waypoints) =>
    waypoints.waypoint.map((w) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      point([Number(w.position[0]!.$.lon), Number(w.position[0]!.$.lat)])
    )
  );
  return points.some((p) => booleanPointInPolygon(p, SPATIAL_LIMITS));
}

export function validateSchedulesContent(
  rtzSchedules?: RtzSchedules[],
): ValidationError[] {
  if (!rtzSchedules) {
    logger.warn({
      method: "VoyagePlansService.validateSchedulesContent",
      message: "No schedules element",
    });

    return [];
  }

  const validationErrors: ValidationError[] = [];

  const now = new Date();

  rtzSchedules.forEach((schedules) => {
    if (!schedules) {
      logger.warn({
        method: "VoyagePlansService.validateSchedulesContent",
        message: "Empty schedule element",
      });

      return;
    }
    schedules.schedule?.forEach((sched) => {
      if (sched?.calculated && sched?.calculated.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!anyTimestampInFuture(sched.calculated[0]!, now)) {
          logger.warn({
            method: "VoyagePlansService.validateSchedulesContent",
            message: "Not timestamps set in future",
          });

          //validationErrors.push(ValidationError.NO_FUTURE_TIMESTAMPS);
          return;
        }
      }
    });
  });

  return validationErrors;
}

function anyTimestampInFuture(schedule: RtzSchedule, now: Date): boolean {
  const timestamps: Date[] = schedule.scheduleElement.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const eta = !curr?.$?.eta ? [new TZDate(curr.$.eta!)] : [];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const etd = !curr?.$?.etd ? [new TZDate(curr.$.etd!)] : [];
    return acc.concat(eta, etd);
  }, [] as Date[]);
  return timestamps.some((ts) => validateTimestamp(ts, now));
}

function validateTimestamp(timestamp: Date, now: Date): boolean {
  return isValid(timestamp) && isAfter(timestamp, now);
}
