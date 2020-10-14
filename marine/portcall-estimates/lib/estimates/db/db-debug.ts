import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";
import {ESTIMATES_BEFORE, ESTIMATES_IN_THE_FUTURE, ShipIdType} from "./db-estimates";

export interface DbDebugShiplist {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_source: string
    readonly ship_name: string
}

const SELECT_BY_LOCODE_DEBUG = `
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
        pe.event_source,
        vessel.name AS ship_name,
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

export function findByLocodeDebug(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbDebugShiplist[]> {
    const ps = new PreparedStatement({
        name: 'find-by-locode-debug',
        text: SELECT_BY_LOCODE_DEBUG,
        values: [locode]
    });
    return db.tx(t => t.manyOrNone(ps));
}
