import {RtzSchedules, RtzVoyagePlan, RtzWaypoint} from "../../../../common/rtz/voyageplan";
import * as jsts from 'jsts';
import moment, {Moment} from 'moment-timezone';
import GeometryFactory = jsts.geom.GeometryFactory;

const gf = new GeometryFactory();

// roughly the Gulf of Finland, Bothnian Sea/Bay and Northern Baltic
const SPATIAL_LIMITS = gf.createPolygon(gf.createLinearRing([
    new jsts.geom.Coordinate(20.84, 68.82),
    new jsts.geom.Coordinate(16.89, 61.70),
    new jsts.geom.Coordinate(20.05, 58.01),
    new jsts.geom.Coordinate(21.90, 58.62),
    new jsts.geom.Coordinate(23.56, 59.02),
    new jsts.geom.Coordinate(28.08, 59.23),
    new jsts.geom.Coordinate(30.72, 59.59),
    new jsts.geom.Coordinate(32.35, 63.10),
    new jsts.geom.Coordinate(30.99, 67.94),
    new jsts.geom.Coordinate(29.62, 70.40),
    new jsts.geom.Coordinate(26.68, 71.28),
    new jsts.geom.Coordinate(21.05, 69.78),
    new jsts.geom.Coordinate(20.84, 68.82)
]), []);

export enum ValidationError {
    EMPTY_VOYAGE_PLAN = 'Empty or null voyage plan',
    MISSING_ROUTE = 'Missing route element',

    // waypoints structure
    MISSING_WAYPOINTS = 'Missing route waypoints',
    MISSING_WAYPOINT = 'Missing waypoint element',
    MISSING_POSITION = 'Missing position element',
    NO_POSITION_ATTRIBUTES = 'No attributes in position element',
    MISSING_LONGITUDE = 'Missing longitude attribute',
    MISSING_LATITUDE = 'Missing latitude attribute',

    // waypoints content
    COORDINATE_OUTSIDE_SPATIAL_LIMITS = 'Coordinate(s) outside spatial limits',

    // schedules
    MISSING_SCHEDULES = 'Missing route schedules',
    MISSING_SCHEDULE = 'Missing schedule element',
    MISSING_MANUAL = 'Missing manual element',
    MISSING_SCHEDULE_ELEMENT = 'Missing scheduleElement element',
    NO_SCHEDULE_ELEMENT_ATTRIBUTES = 'No attributes in scheduleElement',
    NO_ETA_OR_ETD_ATTRIBUTES = 'No ETA or ETD attribute in scheduleElement',

    // schedules content
    INVALID_ETA_TIMESTAMP = 'Invalid ETA timestamp',
    INVALID_ETD_TIMESTAMP = 'Invalid ETD timestamp'
}

export function validateStructure(voyagePlan?: RtzVoyagePlan): ValidationError[] {
    if (!voyagePlan) {
        return [ValidationError.EMPTY_VOYAGE_PLAN];
    }
    if (!voyagePlan.route) {
        return [ValidationError.MISSING_ROUTE];
    }

    return validateWaypointsStructure(voyagePlan.route.waypoints)
        .concat(validateSchedulesStructure(voyagePlan.route.schedules));
}

export function validateWaypointsStructure(wps?: RtzWaypoint[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (!wps || !wps.length) {
        return [ValidationError.MISSING_WAYPOINTS];
    }

    wps.forEach(wp => {
        const w = wp.waypoint;
        if (!w || !w.length) {
            validationErrors.push(ValidationError.MISSING_WAYPOINT);
            return;
        }
        w.forEach(wpElem => {
            const pos = wpElem.position;
            if (!pos || !pos.length) {
                validationErrors.push(ValidationError.MISSING_POSITION);
                return;
            }
            pos.forEach(p => {
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

export function validateSchedulesStructure(schedules?: RtzSchedules[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (!schedules || !schedules.length) {
        return [ValidationError.MISSING_SCHEDULES];
    }

    schedules.forEach(scheds => {
        if (!scheds.schedule || !scheds.schedule.length) {
            validationErrors.push(ValidationError.MISSING_SCHEDULE);
            return;
        }
        scheds.schedule.forEach(sched => {
            if (!sched.manual || !sched.manual.length) {
                validationErrors.push(ValidationError.MISSING_MANUAL);
                return;
            }
            sched.manual.forEach(s => {
                if (!s.scheduleElement || !s.scheduleElement.length) {
                    validationErrors.push(ValidationError.MISSING_SCHEDULE_ELEMENT);
                    return;
                }
                s.scheduleElement.forEach(se => {
                    if (!se.$) {
                        validationErrors.push(ValidationError.NO_SCHEDULE_ELEMENT_ATTRIBUTES);
                        return;
                    }
                    if (!se.$.eta && !se.$.etd) {
                        validationErrors.push(ValidationError.NO_ETA_OR_ETD_ATTRIBUTES);
                    }
                });
            });
        });
    });

    return validationErrors;
}

export function validateContent(voyagePlan: RtzVoyagePlan): ValidationError[] {
    return validateWaypointsContent(voyagePlan.route.waypoints)
        .concat(validateSchedulesContent(voyagePlan.route.schedules));
}

export function validateWaypointsContent(wps: RtzWaypoint[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    wps.forEach(wp => {
        wp.waypoint.forEach(w => {
            w.position.forEach(pos => {
                const lon = Number(pos.$.lon);
                const lat = Number(pos.$.lat);
                const point = gf.createPoint(new jsts.geom.Coordinate(lon, lat));
                if (!SPATIAL_LIMITS.contains(point)) {
                    validationErrors.push(ValidationError.COORDINATE_OUTSIDE_SPATIAL_LIMITS);
                }
            });
        });
    });

    return validationErrors;
}

export function validateSchedulesContent(rtzSchedules: RtzSchedules[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    const now = moment();

    rtzSchedules.forEach(schedules => {
        schedules.schedule.forEach(sched => {
            sched.manual.forEach(s => {
                s.scheduleElement.forEach(se => {
                    if (se.$.eta) {
                        const eta = moment(se.$.eta);
                        if (!validateTimestamp(eta, now)) {
                            validationErrors.push(ValidationError.INVALID_ETA_TIMESTAMP);
                        }
                    }
                    if (se.$.etd) {
                        const etd = moment(se.$.etd);
                        if (!validateTimestamp(etd, now)) {
                            validationErrors.push(ValidationError.INVALID_ETD_TIMESTAMP);
                        }
                    }
                });
            });
        });
    });

    return validationErrors;
}

function validateTimestamp(timestamp: Moment, now: Moment): boolean {
    return timestamp.isValid() && timestamp.isAfter(now);
}
