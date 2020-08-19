import {IDatabase} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";

interface DbEstimate {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_time_confidence_lower?: string
    readonly event_time_confidence_upper?: string
    readonly event_source: string;
    readonly record_time: Date
    readonly ship_id: number;
    readonly ship_id_type: ShipIdType;
    readonly secondary_ship_id?: number;
    readonly secondary_ship_id_type?: ShipIdType;
}

enum ShipIdType {
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
        secondary_ship_id_type)
    VALUES(
        nextval('seq_portcall_estimates'),
        $(event_type),
        $(event_time),
        $(event_time_confidence_lower),
        $(event_time_confidence_upper),
        $(event_source),
        $(record_time),
        $(ship_id),
        $(ship_id_type),
        $(secondary_ship_id),
        $(secondary_ship_id_type)
    )
    ON CONFLICT (event_type, event_time, event_source, ship_id) DO NOTHING
`;

export function updateEstimates(db: IDatabase<any, any>, estimates: ApiEstimate[]): Promise<any>[] {
    return estimates.map(estimate => {
        return db.none(INSERT_ESTIMATES_SQL, createEditObject(estimate));
    });
}

export function createEditObject(e: ApiEstimate): DbEstimate {
    return {
        event_type: e.eventType,
        event_time: moment(e.eventTime).toDate(),
        event_time_confidence_lower: e.eventTimeConfidenceLower,
        event_time_confidence_upper: e.eventTimeConfidenceUpper,
        event_source: e.source,
        record_time: moment(e.recordTime).toDate(),
        ship_id: (e.ship.mmsi ?? e.ship.imo) as number,
        ship_id_type: e.ship.mmsi ? ShipIdType.MMSI : ShipIdType.IMO,
        secondary_ship_id: e.ship.mmsi && e.ship.imo ? e.ship.imo : undefined,
        secondary_ship_id_type: e.ship.mmsi && e.ship.imo ? ShipIdType.IMO : undefined,
    };
}
