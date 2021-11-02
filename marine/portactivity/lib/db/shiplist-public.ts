import {IDatabase, PreparedStatement} from "pg-promise";
import {EventType} from "../model/timestamp";
import {EventSource} from "../model/eventsource";

export interface DbPublicShiplist {
    readonly event_type: EventType
    readonly event_time: string
    readonly event_source: string
    readonly record_time: string
    readonly ship_name: string
    readonly portcall_id: number
}

const SELECT_BY_LOCODE_PUBLIC_SHIPLIST = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_source,
        pe.record_time,
        COALESCE(v.name, pc.vessel_name, 'Unknown') as ship_name,
        pe.portcall_id
    FROM port_call_timestamp pe
    LEFT JOIN public.vessel v on v.imo = pe.ship_imo AND v.timestamp = (SELECT MAX(timestamp) FROM public.vessel WHERE imo = v.imo)
    LEFT JOIN public.port_call pc on pc.imo_lloyds = pe.ship_imo
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_imo = pe.ship_imo AND
                  px.event_source = pe.event_source AND
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > NOW() - INTERVAL '3 HOURS' AND
        pe.event_time < NOW() + INTERVAL '3 DAYS' AND
        CASE WHEN pe.event_type = 'ETA'
        THEN NOT EXISTS(SELECT px.id FROM port_call_timestamp px WHERE px.portcall_id = pe.portcall_id AND px.event_type = 'ATA')
        ELSE TRUE
        END AND
        (pe.location_locode = $1 OR (pe.location_from_locode = $1 AND pe.event_source = '${EventSource.PILOTWEB}'))
    ORDER BY pe.event_time
`;

export function findByLocodePublicShiplist(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbPublicShiplist[]> {
    const ps = new PreparedStatement({
        name:'find-by-locode-public-shiplist',
        text: SELECT_BY_LOCODE_PUBLIC_SHIPLIST,
        values: [locode]
    });
    return db.tx(t => t.manyOrNone(ps));
}
