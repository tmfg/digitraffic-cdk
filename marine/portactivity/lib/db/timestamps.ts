import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiTimestamp, EventType} from "../model/timestamp";
import {DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES, Port} from "../service/portareas";
import moment from "moment";

export const TIMESTAMPS_BEFORE = `CURRENT_DATE - INTERVAL '12 HOURS'`;
export const TIMESTAMPS_IN_THE_FUTURE = `CURRENT_DATE + INTERVAL '3 DAYS'`;

export interface DbTimestamp {
    readonly event_type: EventType
    readonly event_time: Date
    readonly event_time_confidence_lower?: string
    readonly event_time_confidence_lower_diff?: number
    readonly event_time_confidence_upper?: string
    readonly event_time_confidence_upper_diff?: number
    readonly event_source: string
    readonly record_time: Date
    readonly ship_mmsi: number
    readonly ship_imo: number
    readonly location_locode: string
    readonly location_portarea?: string
    readonly location_from_locode?: string
    readonly portcall_id?: number,
    readonly source_id?: string
}

export interface DbETAShip {
    readonly imo: number
    readonly locode: string
    readonly port_area_code?: string
    readonly portcall_id: number
}

export interface DbUpdatedTimestamp {
    readonly ship_mmsi: number
    readonly ship_imo: number
    readonly location_locode: string
}

export interface DbTimestampIdAndLocode {
    readonly id: number
    readonly locode: string
}

export interface DbImo {
    readonly imo: number
}

const INSERT_ESTIMATE_SQL = `
    INSERT INTO port_call_timestamp(
        event_type,
        event_time,
        event_time_confidence_lower,
        event_time_confidence_lower_diff,
        event_time_confidence_upper,
        event_time_confidence_upper_diff,
        event_source,
        record_time,
        location_locode,
        ship_mmsi,
        ship_imo,
        portcall_id,
        location_portarea,
        location_from_locode,
        source_id
        )
    VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           COALESCE(
               $10,
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE imo = $11),
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE imo_lloyds = $11)
           ),
           COALESCE(
               $11,
               (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE mmsi = $10),
               (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE mmsi = $10)
           ),
           COALESCE(
            $12,
            (
                SELECT pc.port_call_id
                FROM public.port_call pc
                JOIN public.port_area_details pac ON pac.port_call_id = pc.port_call_id
                WHERE
                    (
                        pc.mmsi = COALESCE(
                                $10,
                                (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE imo = $11),
                                (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE imo_lloyds = $11)
                        )
                        OR
                        pc.imo_lloyds = COALESCE(
                                $11,
                                (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE mmsi = $10),
                                (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE mmsi = $10)
                        )
                    ) AND
                    pc.port_to_visit = $9::CHARACTER VARYING(5)
                ORDER BY
                    CASE
                        WHEN $1 = 'ETA' THEN ABS(EXTRACT(EPOCH FROM pac.eta - $2))
                        WHEN $1 = 'ATA' THEN ABS(EXTRACT(EPOCH FROM pac.ata - $2))
                        WHEN $1 = 'ETD' THEN ABS(EXTRACT(EPOCH FROM pac.etd - $2))
                        END
                LIMIT 1
            )
           ),
           $13,
           $14,
           $15
    )
    ON CONFLICT(ship_mmsi, ship_imo, event_source, location_locode, event_type, event_time, record_time, portcall_id) DO NOTHING
        RETURNING ship_mmsi, ship_imo, location_locode
`;

const SELECT_BY_LOCODE = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_mmsi,
        pe.ship_imo,            
        pe.location_locode,
        pe.location_portarea,
        pe.location_from_locode,
        pe.portcall_id,
        pe.source_id
    FROM port_call_timestamp pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
          pe.event_time > ${TIMESTAMPS_BEFORE} AND
          pe.event_time < ${TIMESTAMPS_IN_THE_FUTURE} AND
          pe.location_locode = $1
    ORDER by pe.event_time
`;

const SELECT_PORTNET_ETA_SHIP_IMO_BY_LOCODE = `
    SELECT DISTINCT
        pe.ship_imo AS imo, 
        pe.location_locode AS locode,
        pe.location_portarea AS port_area_code,
        pe.location_from_locode,
        pe.portcall_id
    FROM port_call_timestamp pe
    JOIN public.port_call pc ON pc.port_call_id = pe.portcall_id
    JOIN public.port_area_details pad on pad.port_call_id = pe.portcall_id
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.event_source = pe.event_source AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.portcall_id = pe.portcall_id
          ) AND
          pe.event_time < CURRENT_DATE + INTERVAL '1 DAY' AND
          pe.event_type = 'ETA' AND
          pe.event_source = 'Portnet' AND
          pe.location_locode IN ($1:list) AND
          pad.ata IS NULL AND
          pc.port_call_timestamp > CURRENT_DATE - INTERVAL '1 DAY'
`;

// This method builds a query dynamically which is not optimal, instead a proper lookup table should be used.
// On the other hand this allows keeping all the configuration in code.
function SELECT_VTS_A_SHIP_TOO_CLOSE_TO_PORT(
    portAreaThresholds: { locode: string; threshold: number | undefined; portArea: string | undefined }[]): string {
    // fixed structure from SQL VALUES clause
    const thresholdValues = portAreaThresholds.map( p => `('${p.locode}','${p.portArea}',${p.threshold ?? DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES})`).join(',');
    return `
        SELECT DISTINCT
            pe.ship_imo AS imo
        FROM port_call_timestamp pe
        LEFT JOIN (VALUES ${thresholdValues}) AS thresholds(locode, portarea, threshold)
            ON thresholds.locode = pe.location_locode AND thresholds.portarea = pe.location_portarea
        WHERE pe.record_time =
              (
                  SELECT MAX(px.record_time) FROM port_call_timestamp px
                  WHERE px.event_type = pe.event_type AND
                      px.location_locode = pe.location_locode AND
                      px.event_source = pe.event_source AND
                      px.ship_mmsi = pe.ship_mmsi AND
                      px.portcall_id = pe.portcall_id
              ) AND
              pe.portcall_id IN ($1:list) AND
              pe.event_type = 'ETA' AND
              pe.event_source = 'VTS' AND
              pe.event_time < NOW() + ((CASE WHEN thresholds.threshold IS NOT NULL THEN thresholds.threshold 
                ELSE ${DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES} END) || ' MINUTE')::INTERVAL
    `;
}


const SELECT_BY_MMSI = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_mmsi,
        pe.ship_imo,
        pe.location_locode,
        pe.location_portarea,
        pe.location_from_locode,
        pe.portcall_id,
        pe.source_id
    FROM port_call_timestamp pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        pe.event_time < ${TIMESTAMPS_IN_THE_FUTURE} AND
        pe.ship_mmsi = $1
    ORDER by pe.event_time
`;

const SELECT_BY_IMO = `
    SELECT DISTINCT
        pe.event_type,
        pe.event_time,
        pe.event_time_confidence_lower,
        pe.event_time_confidence_lower_diff,
        pe.event_time_confidence_upper,
        pe.event_time_confidence_upper_diff,
        pe.event_source,
        pe.record_time,
        pe.ship_mmsi,
        pe.ship_imo,
        pe.location_locode,
        pe.location_portarea,
        pe.location_from_locode,
        pe.portcall_id,
        pe.source_id
    FROM port_call_timestamp pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        pe.event_time < ${TIMESTAMPS_IN_THE_FUTURE} AND
        pe.ship_imo = $1
    ORDER by pe.event_time
`;

const SELECT_BY_PORTCALL_ID_AND_LOCODE = `
    SELECT
    id,
    location_locode
    FROM port_call_timestamp
    WHERE
          portcall_id = $1 AND
          location_locode != $2 AND
          event_source = 'Portnet'
`;

const DELETE_BY_ID = `
    DELETE FROM port_call_timestamp
    WHERE id = $1
`;

const REMOVE_TIMESTAMPS_SQL = `
    DELETE FROM port_call_timestamp
    where 
        event_source = $1 AND 
        source_id in ($2:list)
    returning id
`;

export function updateTimestamp(db: IDatabase<any, any>, timestamp: ApiTimestamp): Promise<DbUpdatedTimestamp | null> {
    const ps = new PreparedStatement({
        name: 'update-timestamps',
        text: INSERT_ESTIMATE_SQL
    });
    return db.oneOrNone(ps, createUpdateValues(timestamp));
}

export async function removeTimestamps(db: IDatabase<any, any>, source: string, sourceIds: string[]): Promise<number[]> {
    if(sourceIds.length > 0) {
        return db.manyOrNone(REMOVE_TIMESTAMPS_SQL, [source, sourceIds])
            .then(array => array.map(object => object.id));
    }

    return Promise.resolve([]);
}

export function findByLocode(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: 'find-by-locode',
        text: SELECT_BY_LOCODE,
        values: [locode.toUpperCase()]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function findByMmsi(
    db: IDatabase<any, any>,
    mmsi: number,
): Promise<DbTimestamp[]> {
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
): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: 'find-by-imo',
        text: SELECT_BY_IMO,
        values: [imo]
    });
    return db.tx(t => t.manyOrNone(ps));
}

export function findPortnetETAsByLocodes(
    db: IDatabase<any, any>,
    locodes: string[]
): Promise<DbETAShip[]> {
    // Prepared statement use not possible due to dynamic IN-list
    return db.tx(t => t.manyOrNone(SELECT_PORTNET_ETA_SHIP_IMO_BY_LOCODE, [locodes]));
}

export function findVtsShipImosTooCloseToPortByPortCallId(
    db: IDatabase<any, any>,
    portcallIds: number[],
    ports: Port[]
): Promise<DbImo[]> {
    const portAreasWithLocode =
        ports.flatMap(p =>
            p.areas.map(a => ({
                locode: p.locode,
                portArea: a.portAreaCode,
                threshold: a.shipApproachThresholdMinutes
            })));
    // Prepared statement use not possible due to dynamic IN-list
    return db.tx(t => t.manyOrNone(SELECT_VTS_A_SHIP_TOO_CLOSE_TO_PORT(portAreasWithLocode), [
        portcallIds
    ]));
}

export function findPortnetTimestampsForAnotherLocode(
    db: IDatabase<any, any>,
    portcallId: number,
    locode: string
): Promise<DbTimestampIdAndLocode[]> {
    const ps = new PreparedStatement({
        name: 'find-by-portcall-id-and-locode',
        text: SELECT_BY_PORTCALL_ID_AND_LOCODE,
        values: [portcallId, locode]
    });
    return db.manyOrNone(ps);
}

export function deleteById(
    db: IDatabase<any, any>,
    id: number
): Promise<null> {
    const ps = new PreparedStatement({
        name: 'delete-by-id',
        text: DELETE_BY_ID,
        values: [id]
    });
    return db.none(ps);
}

export function createUpdateValues(e: ApiTimestamp): any[] {
    return [
        e.eventType, // event_type
        moment(e.eventTime).toDate(), // event_time
        e.eventTimeConfidenceLower, // event_time_confidence_lower
        (e.eventTimeConfidenceLower ? diffDuration(e.eventTime, e.eventTimeConfidenceLower) : undefined), // event_time_confidence_lower_diff
        e.eventTimeConfidenceUpper, // event_time_confidence_upper
        (e.eventTimeConfidenceUpper ? diffDuration(e.eventTime, e.eventTimeConfidenceUpper) : undefined), // event_time_confidence_upper_diff
        e.source, // event_source
        moment(e.recordTime).toDate(), // record_time
        e.location.port, // location_locode
        e.ship.mmsi && e.ship.mmsi !== 0 ? e.ship.mmsi : undefined,  // ship_mmsi
        e.ship.imo && e.ship.imo !== 0 ? e.ship.imo : undefined,  // ship_imo,
        e.portcallId,
        e.location.portArea,
        e.location.from,
        e.sourceId              // source_id
    ];
}

function diffDuration(eventTime: string, confLower: string): number {
    return moment(eventTime).valueOf() - moment(eventTime).subtract(moment.duration(confLower)).valueOf();
}
