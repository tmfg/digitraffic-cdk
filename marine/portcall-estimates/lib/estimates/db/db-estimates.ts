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
    readonly ship_mmsi: number
    readonly ship_imo: number
    readonly location_locode: string
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
        location_locode,
        ship_mmsi,
        ship_imo
        )
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
           COALESCE(
               $10,
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM vessel WHERE imo = $11),
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE imo_lloyds = $11)
           ),
           COALESCE(
               $11,
               (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM vessel WHERE mmsi = $10),
               (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE mmsi = $10)
           )
    )
    ON CONFLICT(ship_mmsi, ship_imo, event_source, event_type, event_time, record_time) DO NOTHING
        RETURNING ship_mmsi, ship_imo
`;

const SELECT_BY_LOCODE = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_mmsi,
               ship_imo,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE} AND
            location_locode = $1
        GROUP BY event_type,
                 ship_mmsi,
                 ship_imo,
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
        pe.ship_mmsi,
        pe.ship_imo,            
        pe.location_locode,
        FIRST_VALUE(pe.event_time) OVER (
            PARTITION BY pe.event_type, pe.ship_mmsi, pe.ship_imo
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
    ORDER BY event_group_time
`;

const SELECT_BY_MMSI = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_mmsi,
               ship_imo,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE}
        GROUP BY event_type,
                 ship_mmsi,
                 ship_imo,
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
        pe.ship_mmsi,
        pe.ship_imo,
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
    JOIN newest ON newest.re = pe.record_time AND
         newest.event_type = pe.event_type AND
         newest.event_source = pe.event_source
    WHERE pe.ship_mmsi = $1
    ORDER BY event_group_time
`;

const SELECT_BY_IMO = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_mmsi,
               ship_imo,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE
            event_time > ${ESTIMATES_BEFORE} AND
            event_time < ${ESTIMATES_IN_THE_FUTURE}
        GROUP BY event_type,
                 ship_mmsi,
                 ship_imo,
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
        pe.ship_mmsi,
        pe.ship_imo,
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
    JOIN newest ON newest.re = pe.record_time AND
         newest.event_type = pe.event_type AND
         newest.event_source = pe.event_source
    WHERE pe.ship_imo = $1
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
        e.location.port, // location_locode
        e.ship.mmsi && e.ship.mmsi != 0 ? e.ship.mmsi : undefined,  // ship_mmsi
        e.ship.imo && e.ship.imo != 0 ? e.ship.imo : undefined,  // ship_imo
    ];
}

function diffDuration(eventTime: string, confLower: string): number {
    return moment(eventTime).valueOf() - moment(eventTime).subtract(moment.duration(confLower)).valueOf();
}
