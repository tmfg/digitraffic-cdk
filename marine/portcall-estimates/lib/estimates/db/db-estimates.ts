import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";

export const ESTIMATES_BEFORE = `CURRENT_DATE - INTERVAL '12 DAYS'`;
export const ESTIMATES_IN_THE_FUTURE = `CURRENT_DATE + INTERVAL '3 DAYS'`;

export interface DbEstimate {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_time_confidence_lower?: string
    readonly event_time_confidence_lower_diff?: number
    readonly event_time_confidence_upper?: string
    readonly event_time_confidence_upper_diff?: number
    readonly event_source: string;
    readonly record_time: Date
    readonly ship_id: number;
    readonly ship_id_type: ShipIdType;
    readonly secondary_ship_id?: number;
    readonly secondary_ship_id_type?: ShipIdType;
    readonly location_locode: string;
}

export enum ShipIdType {
    MMSI = 'mmsi', IMO = 'imo'
}

const INSERT_ESTIMATE_SQL = `
    INSERT INTO portcall_estimate(
        event_type,
        event_time,
        event_time_confidence_lower,
        event_time_confidence_lower_diff,
        event_time_confidence_upper,
        event_time_confidence_upper_diff,
        event_source,
        record_time,
        ship_id,
        ship_id_type,
        secondary_ship_id,
        secondary_ship_id_type,
        location_locode)
    VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11,
           $12,
           $13
    )
    ON CONFLICT(ship_id, event_source, event_time, record_time) DO NOTHING
        RETURNING ship_id, ship_id_type, secondary_ship_id, secondary_ship_id_type
`;

const SELECT_BY_LOCODE = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               vessel.mmsi AS mmsi,
               vessel.imo AS imo,
               location_locode,
               event_source
        FROM portcall_estimate
        JOIN vessel ON CASE WHEN ship_id_type = 'mmsi' THEN vessel.mmsi = ship_id ELSE vessel.imo = ship_id END
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE} AND
            location_locode = $1
        GROUP BY event_type,
                 vessel.mmsi,
                 vessel.imo,
                 location_locode,
                 event_source
    )
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        vessel.mmsi AS ship_id,
        '${ShipIdType.MMSI}' as ship_id_type,
        vessel.imo as secondary_ship_id,
        '${ShipIdType.IMO}' as secondary_ship_id_type,
        pe.location_locode,
        FIRST_VALUE(pe.event_time) OVER (
            PARTITION BY pe.event_type, pe.ship_id
            ORDER BY
                (CASE WHEN (event_time_confidence_lower IS NULL OR event_time_confidence_upper IS NULL) THEN 1 ELSE -1 END),
                pe.event_time_confidence_lower_diff,
                pe.event_time_confidence_upper_diff,
                pe.record_time DESC
            ) AS event_group_time
    FROM portcall_estimate pe
        JOIN newest ON newest.re = pe.record_time
        AND newest.event_type = pe.event_type
        AND newest.event_source = pe.event_source
        AND newest.location_locode = pe.location_locode
        JOIN vessel ON CASE WHEN ship_id_type = 'mmsi' THEN vessel.mmsi = ship_id ELSE vessel.imo = ship_id END
    ORDER BY event_group_time
`;

const SELECT_BY_MMSI = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               vessel.mmsi,
               vessel.imo,
               location_locode,
               event_source
        FROM portcall_estimate
                 JOIN vessel ON vessel.mmsi = $1
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE} AND
            CASE WHEN ship_id_type = 'mmsi' THEN ship_id = vessel.mmsi ELSE ship_id = vessel.imo END
        GROUP BY event_type,
                 vessel.mmsi,
                 vessel.imo,
                 location_locode,
                 event_source
    )
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        vessel.mmsi AS ship_id,
        '${ShipIdType.MMSI}' as ship_id_type,
        vessel.imo as secondary_ship_id,
        '${ShipIdType.IMO}' as secondary_ship_id_type,
        pe.location_locode,
        FIRST_VALUE(pe.event_time) OVER (
            PARTITION BY pe.event_type, pe.location_locode
            ORDER BY
                (CASE WHEN (event_time_confidence_lower IS NULL OR event_time_confidence_upper IS NULL) THEN 1 ELSE -1 END),
                pe.event_time_confidence_lower_diff,
                pe.event_time_confidence_upper_diff,
                pe.record_time DESC
            ) AS event_group_time
    FROM portcall_estimate pe
             JOIN vessel ON vessel.mmsi = $1
             JOIN newest ON newest.re = pe.record_time
        AND newest.event_type = pe.event_type
        AND newest.event_source = pe.event_source
        AND CASE WHEN ship_id_type = 'mmsi' THEN ship_id = vessel.mmsi ELSE ship_id = vessel.imo END
    ORDER BY event_group_time
`;

const SELECT_BY_IMO = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               vessel.mmsi,
               vessel.imo,
               location_locode,
               event_source
        FROM portcall_estimate
        JOIN vessel ON vessel.imo = $1
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE} AND
            CASE WHEN ship_id_type = 'mmsi' THEN ship_id = vessel.mmsi ELSE ship_id = vessel.imo END
        GROUP BY event_type,
                 vessel.mmsi,
                 vessel.imo,
                 location_locode,
                 event_source
    )
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        vessel.mmsi AS ship_id,
        '${ShipIdType.MMSI}' as ship_id_type,
        vessel.imo as secondary_ship_id,
        '${ShipIdType.IMO}' as secondary_ship_id_type,
        pe.location_locode,
        FIRST_VALUE(pe.event_time) OVER (
            PARTITION BY pe.event_type, pe.location_locode
            ORDER BY
                (CASE WHEN (event_time_confidence_lower IS NULL OR event_time_confidence_upper IS NULL) THEN 1 ELSE -1 END),
                pe.event_time_confidence_lower_diff,
                pe.event_time_confidence_upper_diff,
                pe.record_time DESC
            ) AS event_group_time
    FROM portcall_estimate pe
             JOIN vessel ON vessel.imo = $1
             JOIN newest ON newest.re = pe.record_time
        AND newest.event_type = pe.event_type
        AND newest.event_source = pe.event_source
        AND CASE WHEN ship_id_type = 'mmsi' THEN ship_id = vessel.mmsi ELSE ship_id = vessel.imo END
    ORDER BY event_group_time
`;

export function updateEstimate(db: IDatabase<any, any>, estimate: ApiEstimate): Promise<any> {
    const ps = new PreparedStatement({
        name: 'update-estimates',
        text: INSERT_ESTIMATE_SQL,
    });
    return db.oneOrNone(ps, createUpdateValues(estimate));
}

export function findByLocode(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbEstimate[]> {
    const ps = new PreparedStatement({
        name: 'find-by-locode',
        text: SELECT_BY_LOCODE,
        values: [locode]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function findByMmsi(
    db: IDatabase<any, any>,
    mmsi: number,
): Promise<DbEstimate[]> {
    const ps = new PreparedStatement({
        name: 'find-by-mmsi',
        text: SELECT_BY_MMSI,
        values: [mmsi]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function findByImo(
    db: IDatabase<any, any>,
    imo: number,
): Promise<DbEstimate[]> {
    const ps = new PreparedStatement({
        name: 'find-by-imo',
        text: SELECT_BY_IMO,
        values: [imo]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function createUpdateValues(e: ApiEstimate): any[] {
    return [
        e.eventType, // event_type
        moment(e.eventTime).toDate(), // event_time
        e.eventTimeConfidenceLower, // event_time_confidence_lower
        (e.eventTimeConfidenceLower ? diffDuration(e.eventTime, e.eventTimeConfidenceLower) : undefined), // event_time_confidence_lower_diff
        e.eventTimeConfidenceUpper, // event_time_confidence_upper
        (e.eventTimeConfidenceUpper ? diffDuration(e.eventTime, e.eventTimeConfidenceUpper) : undefined), // event_time_confidence_upper_diff
        e.source, // event_source
        moment(e.recordTime).toDate(), // record_time
        e.ship.mmsi && e.ship.mmsi != 0 ? e.ship.mmsi : e.ship.imo,  // ship_id
        e.ship.mmsi && e.ship.mmsi != 0 ? ShipIdType.MMSI : ShipIdType.IMO, // ship_id_type
        e.ship.mmsi && e.ship.mmsi != 0 && e.ship.imo ? e.ship.imo : undefined, // secondary_ship_id
        e.ship.mmsi && e.ship.mmsi != 0 && e.ship.imo ? ShipIdType.IMO : undefined, // secondary_ship_id_type
        e.location.port // location_locode
    ];
}

function diffDuration(eventTime: string, confLower: string): number {
    return moment(eventTime).valueOf() - moment(eventTime).subtract(moment.duration(confLower)).valueOf();
}
