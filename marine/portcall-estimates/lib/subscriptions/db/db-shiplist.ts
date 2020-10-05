import {IDatabase, PreparedStatement} from "pg-promise";

export interface ShiplistEstimate {
    readonly event_type: string
    readonly event_time: Date
    readonly event_source: string;
    readonly ship_id: number;
}

const SELECT_BY_LOCODE = `
    WITH newest AS (
        SELECT MAX(record_time) re,
               event_type,
               ship_id,
               location_locode,
               event_source
        FROM portcall_estimate
        WHERE date_trunc('day', event_time) = date_trunc('day', current_date)
        AND location_locode = $1
        GROUP BY event_type,
                 ship_id,
                 location_locode,
                 event_source
    )
    SELECT
        pe.event_type,
        pe.event_time,
        pe.event_source,
        coalesce(pe.ship_id, pe.secondary_ship_id) ship_id,
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
        AND newest.location_locode = $1
        AND date_trunc('day', pe.event_time) = date_trunc('day', current_date)
    ORDER BY event_group_time
`;

export function findByLocode(
    db: IDatabase<any, any>,
    locode: string
): Promise<ShiplistEstimate[]> {
    const ps = new PreparedStatement({
        name: 'find-by-locode',
        text: SELECT_BY_LOCODE,
        values: [locode]
    });
    return db.tx(t => t.manyOrNone(ps));
}