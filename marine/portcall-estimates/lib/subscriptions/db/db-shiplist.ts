import {ITask, PreparedStatement} from "pg-promise";

export interface ShiplistEstimate {
    readonly event_type: string
    readonly event_time: Date
    readonly event_source: string;
    readonly ship_imo: number;
    readonly ship_name: string;
    readonly portcall_id: number;
}

const SELECT_IMO = '          AND pe.ship_imo = $4';
const SELECT_BY_LOCODE_AND_IMO = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_source,
        v.imo ship_imo,
        COALESCE(v.name, pc.vessel_name, 'Unknown') as ship_name,
        pe.portcall_id
    FROM portcall_estimate pe
    LEFT JOIN vessel v on v.imo = pe.ship_imo AND v.timestamp = (SELECT MAX(timestamp) FROM vessel WHERE imo = v.imo)
    LEFT JOIN port_call pc on pc.imo_lloyds = pe.ship_imo
    WHERE pe.record_time = (
              SELECT MAX(px.record_time) FROM portcall_estimate px
              WHERE px.event_type = pe.event_type 
              AND px.location_locode = pe.location_locode 
              AND px.ship_imo = pe.ship_imo 
              AND px.event_source = pe.event_source 
              AND 
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) 
    AND (pe.event_time between $2 and $3) 
    AND pe.location_locode = $1
    AND pe.event_type IN ('ETA', 'ETD')
    IMO_CONDITION
    ORDER BY pe.event_time
`;

const findByLocodeAndImoPs = new PreparedStatement({
    name: 'find-shiplist-by-locode-and-imo',
    text: SELECT_BY_LOCODE_AND_IMO.replace(/IMO_CONDITION/gi, SELECT_IMO)
});

const findByLocodePs = new PreparedStatement({
    name: 'find-shiplist-by-locode',
    text: SELECT_BY_LOCODE_AND_IMO.replace(/IMO_CONDITION/gi, '')
});

export function findByLocodeAndImo(
    t: ITask<any>,
    startTime: Date,
    endTime: Date,
    locode: string,
    imo: number
): Promise<ShiplistEstimate[]> {
    return t.manyOrNone(findByLocodeAndImoPs, [locode, startTime, endTime, imo]);
}

export function findByLocode(
    t: ITask<any>,
    startTime: Date,
    endTime: Date,
    locode: string
): Promise<ShiplistEstimate[]> {
    return t.manyOrNone(findByLocodePs, [locode, startTime, endTime]);
}
