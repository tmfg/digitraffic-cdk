import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";

const ESTIMATES_BEFORE = `CURRENT_DATE - INTERVAL '12 DAYS'`;

export interface DbEstimate {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_time_confidence_lower?: Date
    readonly event_time_confidence_upper?: Date
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
            event_time_confidence_upper,
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
            $(event_time_confidence_upper),
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
        SELECT
        event_type,
        event_time,
        event_time_confidence_lower,
        event_time_confidence_upper,
        event_source,
        record_time,
        ship_id,
        ship_id_type,
        secondary_ship_id,
        secondary_ship_id_type,
        location_locode
        FROM portcall_estimate
        WHERE location_locode = $1
        AND record_time > ${ESTIMATES_BEFORE}
`;

const SELECT_BY_MMSI = `
        SELECT
        event_type,
        event_time,
        event_time_confidence_lower,
        event_time_confidence_upper,
        event_source,
        record_time,
        ship_id,
        ship_id_type,
        secondary_ship_id,
        secondary_ship_id_type,
        location_locode
        FROM portcall_estimate
        WHERE ship_id_type = 'MMSI'
        AND ship_id = $1
        AND record_time > ${ESTIMATES_BEFORE}
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
    mmsi: string,
): Promise<DbEstimate[]> {
    const ps = new PreparedStatement({
        name: 'find-by-mmsi',
        text: SELECT_BY_MMSI,
        values: [mmsi]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function createEditObject(e: ApiEstimate): DbEstimate {
    return {
        event_type: e.eventType,
        event_time: moment(e.eventTime).toDate(),
        event_time_confidence_lower: e.eventTimeConfidenceLower ? moment(e.eventTime).subtract(moment.duration(e.eventTimeConfidenceLower)).toDate() : undefined,
        event_time_confidence_upper: e.eventTimeConfidenceUpper ? moment(e.eventTime).add(moment.duration(e.eventTimeConfidenceUpper)).toDate() : undefined,
        event_source: e.source,
        record_time: moment(e.recordTime).toDate(),
        ship_id: (e.ship.mmsi ?? e.ship.imo) as number,
        ship_id_type: e.ship.mmsi ? ShipIdType.MMSI : ShipIdType.IMO,
        secondary_ship_id: e.ship.mmsi && e.ship.imo ? e.ship.imo : undefined,
        secondary_ship_id_type: e.ship.mmsi && e.ship.imo ? ShipIdType.IMO : undefined,
        location_locode: e.location.port
    };
}
