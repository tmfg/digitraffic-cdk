import pgPromise from "pg-promise";
import type { EventType } from "../model/timestamp.js";
import { EventSource } from "../model/eventsource.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export interface DbPublicShiplist {
  readonly event_type: EventType;
  readonly event_time: Date;
  readonly event_source: string;
  readonly record_time: Date;
  readonly ship_name: string;
  readonly portcall_id: number;
  readonly ship_imo: number;
}

const SELECT_BY_LOCODE_PUBLIC_SHIPLIST = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_source,
        pe.record_time,
        COALESCE(v.name, upper(pc.vessel_name), 'Unknown') as ship_name,
        pe.portcall_id,
        pe.ship_imo
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
                  ELSE TRUE
                  END
          ) AND
        CASE WHEN (pe.event_type = 'ATA' OR pe.event_type = 'ATD')
        THEN pe.event_time > NOW() - INTERVAL '6 HOURS'
        ELSE pe.event_time > NOW() - INTERVAL '1 HOURS' 
        END AND
        pe.event_time < NOW() + $2 * INTERVAL '1 HOUR' AND
        CASE WHEN pe.event_type = 'ETA'
        THEN NOT EXISTS(SELECT px.id FROM port_call_timestamp px WHERE px.portcall_id = pe.portcall_id AND px.event_type = 'ATA')
        ELSE TRUE
        END AND
        (pe.location_locode = $1 OR (pe.location_from_locode = $1 AND pe.event_source = '${EventSource.PILOTWEB}'))
    ORDER BY pe.event_time
`;

export function findByLocodePublicShiplist(
  db: DTDatabase,
  locode: string,
  interval: number,
): Promise<DbPublicShiplist[]> {
  const ps = new pgPromise.PreparedStatement({
    name: "find-by-locode-public-shiplist",
    text: SELECT_BY_LOCODE_PUBLIC_SHIPLIST,
    values: [locode, interval],
  });
  return db.tx((t) => t.manyOrNone(ps));
}
