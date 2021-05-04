import {RtzVoyagePlan} from "../../../../common/vis/voyageplan";
import * as jsts from 'jsts';
import Coordinate = jsts.geom.Coordinate;
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
    const wps = voyagePlan.route.waypoints;
    if (!wps || !wps.length) {
        return ['Missing route waypoints'];
    }
    const validationErrors: ValidationError[] = [];
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

export function validateContent(voyagePlan: RtzVoyagePlan): ValidationError[] {
    const validationErrors: ValidationError[] = [];
    voyagePlan.route.waypoints.forEach(wp => {
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
