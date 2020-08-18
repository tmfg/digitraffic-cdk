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
    readonly ship_id: string;
    readonly ship_id_type: ShipIdType;
}

enum ShipIdType {
    MMSI = 's', IMO = 'o'
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
        ship_id_type)
    VALUES(
        nextval('seq_portcall_estimates'),
        $(event_type),
        $(event_time),
        $(event_time_confidence_lower),
        $(event_time_confidence_upper),
        $(event_source),
        $(record_time),
        $(ship_id),
        $(ship_id_type)
    )
    ON CONFLICT (event_type, event_time, event_source, ship_id) DO NOTHING
`;

export function updateEstimates(db: IDatabase<any, any>, estimates: ApiEstimate[]): Promise<any>[] {
    return estimates.map(estimate => {
        return db.none(INSERT_ESTIMATES_SQL, createEditObject(estimate));
    });
}

export function createEditObject(estimate: ApiEstimate): DbEstimate {
    return {
        event_type: estimate.eventType,
        event_time: moment(estimate.eventTime).toDate(),
        event_time_confidence_lower: estimate.eventTimeConfidenceLower,
        event_time_confidence_upper: estimate.eventTimeConfidenceUpper,
        event_source: estimate.source,
        record_time: moment(estimate.recordTime).toDate(),
        ship_id: (estimate.ship.mmsi ?? estimate.ship.imo) as string,
        ship_id_type: estimate.ship.mmsi ? ShipIdType.MMSI : ShipIdType.IMO
    };
}
