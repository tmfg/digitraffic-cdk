import {RtzSchedules, RtzVoyagePlan, RtzWaypoint} from "../../../../common/rtz/voyageplan";
import * as jsts from 'jsts';
import moment, {Moment} from 'moment-timezone';
import GeometryFactory = jsts.geom.GeometryFactory;

type ValidationError = string;

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

export function validateStructure(voyagePlan?: RtzVoyagePlan): ValidationError[] {
    if (!voyagePlan) {
        return ['Empty or null voyage plan'];
    }
    if (!voyagePlan.route) {
        return ['Missing route element'];
    }

    return validateWaypointsStructure(voyagePlan.route.waypoints)
        .concat(validateSchedulesStructure(voyagePlan.route.schedules));
}

export function validateWaypointsStructure(wps?: RtzWaypoint[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (!wps || !wps.length) {
        return ['Missing route waypoints'];
    }

    wps.forEach(wp => {
        const w = wp.waypoint;
        if (!w || !w.length) {
            validationErrors.push('Missing waypoint element');
            return;
        }
        w.forEach(wpElem => {
            const pos = wpElem.position;
            if (!pos || !pos.length) {
                validationErrors.push('Missing position element');
                return;
            }
            pos.forEach(p => {
                const posAttrs = p.$;
                if (!posAttrs) {
                    validationErrors.push('No attributes in position element');
                    return;
                }
                const lon = posAttrs.lon;
                if (!lon) {
                    validationErrors.push('Missing longitude attribute');
                }
                const lat = posAttrs.lat;
                if (!lat) {
                    validationErrors.push('Missing latitude attribute');
                }
            });
        });
    });

    return validationErrors;
}

export function validateSchedulesStructure(schedules?: RtzSchedules[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (!schedules || !schedules.length) {
        return ['Missing route schedules'];
    }

    schedules.forEach(scheds => {
        if (!scheds.schedule || !scheds.schedule.length) {
            validationErrors.push('Missing schedule element');
            return;
        }
        scheds.schedule.forEach(sched => {
            if (!sched.manual || !sched.manual.length) {
                validationErrors.push('Missing manual element');
                return;
            }
            sched.manual.forEach(s => {
                if (!s.scheduleElement || !s.scheduleElement.length) {
                    validationErrors.push('Missing scheduleElement element');
                    return;
                }
                s.scheduleElement.forEach(se => {
                    if (!se.$) {
                        validationErrors.push('No attributes in scheduleElement');
                        return;
                    }
                    if (!se.$.eta && !se.$.etd) {
                        validationErrors.push('No ETA or ETD attribute in scheduleElement');
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
                    validationErrors.push(`Coordinate outside spatial limits lon: ${point.getX()}, lat: ${point.getY()}`);
                }
            });
        });
    });

    return validationErrors;
}

export function validateSchedulesContent(schedules: RtzSchedules[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    const now = moment();

    schedules.forEach(schedules => {
        schedules.schedule.forEach(sched => {
            sched.manual.forEach(s => {
                s.scheduleElement.forEach(se => {
                    if (se.$.eta) {
                        const eta = moment(se.$.eta);
                        if (!validateTimestamp(eta, now)) {
                            validationErrors.push(`Invalid ETA timestamp ${se.$.eta}`);
                        }
                    }
                    if (se.$.etd) {
                        const etd = moment(se.$.etd);
                        if (!validateTimestamp(etd, now)) {
                            validationErrors.push(`Invalid ETD timestamp ${se.$.etd}`);
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
