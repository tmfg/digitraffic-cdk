import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiEstimate, EventType, Ship} from "../model/estimate";
import moment from "moment";
import {ShipIdType} from "./db-estimates";

export interface DbSubscription {
    readonly subscriber_id: number
    readonly ship_id: number
    readonly ship_id_type: ShipIdType
    readonly event_type: EventType
    readonly location_locode: string
    readonly last_sent_time?: Date
    readonly last_sent_value?: Date
}

const SELECT_BY_MMSI_OR_IMO = `
    SELECT
        subscriber_id,
        ship_id,
        ship_id_type,
        event_type,
        location_locode,
        last_sent_time,
        last_sent_value
    FROM portcall_estimate_subscription
    WHERE
    (ship_id_type = 'mmsi' AND ship_id = ANY($1)) OR
    (ship_id_type = 'imo' AND ship_id = ANY($2))
`;

export function findSubscriptions(
    db: IDatabase<any, any>,
    mmsis: number[],
    imos: number[]
): Promise<DbSubscription[]> {
    const ps = new PreparedStatement({
        name: 'find-subscriptions-by-ship',
        text: SELECT_BY_MMSI_OR_IMO,
        values: [`{${mmsis.join(',')}}`, `{${imos.join(',')}}`] // prepared statement array support hack
    });
    return db.tx(t => t.manyOrNone(`
    SELECT
        subscriber_id,
        ship_id,
        ship_id_type,
        event_type,
        location_locode,
        last_sent_time,
        last_sent_value
    FROM portcall_estimate_subscription
    `));
}
