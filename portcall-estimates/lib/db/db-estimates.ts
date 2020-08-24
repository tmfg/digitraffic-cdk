import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";

const ESTIMATES_BEFORE = `CURRENT_DATE - INTERVAL '12 DAYS'`;

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

const INSERT_ESTIMATES_SQL = `
        INSERT INTO portcall_estimate(
            id,
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
        VALUES (nextval('seq_portcall_estimates'),
            $(event_type),
            $(event_time),
            $(event_time_confidence_lower),
            $(event_time_confidence_lower_diff),
            $(event_time_confidence_upper),
            $(event_time_confidence_upper_diff),
            $(event_source),
            $(record_time),
            $(ship_id),
            $(ship_id_type),
            $(secondary_ship_id),
            $(secondary_ship_id_type),
            $(location_locode))
        ON CONFLICT(ship_id, event_source, event_time) DO NOTHING
`;

const SELECT_BY_LOCODE = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_id,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE record_time > ${ESTIMATES_BEFORE}
        GROUP BY event_type,
                 ship_id,
                 location_locode,
                 event_source
    )
    SELECT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_id,
        pe.ship_id_type,
        pe.secondary_ship_id,
        pe.secondary_ship_id_type,
        pe.location_locode
    FROM portcall_estimate pe
             JOIN newest ON newest.re = pe.record_time
        AND newest.event_type = pe.event_type
        AND newest.event_source = pe.event_source
        AND newest.location_locode = $1
    ORDER BY
        (CASE WHEN (event_time_confidence_lower_diff IS NULL OR event_time_confidence_upper_diff IS NULL) THEN -1 ELSE 1 END),
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper_diff,
        pe.record_time DESC
`;

const SELECT_BY_MMSI = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_id,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE ship_id_type = '${ShipIdType.MMSI}'
        AND record_time > ${ESTIMATES_BEFORE}
        GROUP BY event_type,
                 ship_id,
                 location_locode,
                 event_source
    )
    SELECT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_id,
        pe.ship_id_type,
        pe.secondary_ship_id,
        pe.secondary_ship_id_type,
        pe.location_locode
    FROM portcall_estimate pe
    JOIN newest ON newest.re = pe.record_time
    AND newest.event_type = pe.event_type
    AND newest.event_source = pe.event_source
    AND newest.ship_id = $1
    ORDER BY
        (CASE WHEN (event_time_confidence_lower_diff IS NULL OR event_time_confidence_upper_diff IS NULL) THEN -1 ELSE 1 END),
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper_diff,
        pe.record_time DESC
`;

const SELECT_BY_IMO = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               (CASE WHEN ship_id_type = '${ShipIdType.IMO}' then ship_id ELSE secondary_ship_id END) as shipid,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE (ship_id_type = '${ShipIdType.IMO}' or secondary_ship_id_type = '${ShipIdType.IMO}')
        AND record_time > ${ESTIMATES_BEFORE}
        GROUP BY event_type,
                 (CASE WHEN ship_id_type = '${ShipIdType.IMO}' then ship_id ELSE secondary_ship_id END),
                 location_locode,
                 event_source
    )
    SELECT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_id,
        pe.ship_id_type,
        pe.secondary_ship_id,
        pe.secondary_ship_id_type,
        pe.location_locode
    FROM portcall_estimate pe
    JOIN newest ON newest.re = pe.record_time
    AND newest.event_type = pe.event_type
    AND newest.event_source = pe.event_source
    AND newest.shipid = $1
    ORDER BY
        (CASE WHEN (event_time_confidence_lower_diff IS NULL OR event_time_confidence_upper_diff IS NULL) THEN -1 ELSE 1 END),
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper_diff,
        pe.record_time DESC
`;

export function updateEstimates(db: IDatabase<any, any>, estimates: ApiEstimate[]): Promise<any>[] {
    return estimates.map(estimate => {
        return db.none(INSERT_ESTIMATES_SQL, createEditObject(estimate));
    });
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

export function createEditObject(e: ApiEstimate): DbEstimate {
    return {
        event_type: e.eventType,
        event_time: moment(e.eventTime).toDate(),
        event_time_confidence_lower: e.eventTimeConfidenceLower,
        event_time_confidence_lower_diff: e.eventTimeConfidenceLower ? diffConfidenceLower(e.eventTime, e.eventTimeConfidenceLower) : undefined,
        event_time_confidence_upper: e.eventTimeConfidenceUpper,
        event_time_confidence_upper_diff: e.eventTimeConfidenceUpper ? diffConfidenceUpper(e.eventTime, e.eventTimeConfidenceUpper) : undefined,
        event_source: e.source,
        record_time: moment(e.recordTime).toDate(),
        ship_id: (e.ship.mmsi ?? e.ship.imo) as number,
        ship_id_type: e.ship.mmsi ? ShipIdType.MMSI : ShipIdType.IMO,
        secondary_ship_id: e.ship.mmsi && e.ship.imo ? e.ship.imo : undefined,
        secondary_ship_id_type: e.ship.mmsi && e.ship.imo ? ShipIdType.IMO : undefined,
        location_locode: e.location.port
    };
}

function diffConfidenceLower(eventTime: string, confLower: string): number {
    return moment(eventTime).valueOf() - moment(eventTime).subtract(moment.duration(confLower)).valueOf();
}

function diffConfidenceUpper(eventTime: string, confUpper: string): number {
    return moment(eventTime).add(moment.duration(confUpper)).valueOf() - moment(eventTime).valueOf();
}