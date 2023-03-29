import { PreparedStatement } from "pg-promise";
import { ApiTimestamp, EventType } from "../model/timestamp";
import { DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES } from "../service/portareas";
import { EventSource } from "../model/eventsource";
import { DTDatabase, DTTransaction } from "@digitraffic/common/dist/database/database";
import { Countable, Identifiable } from "@digitraffic/common/dist/database/models";
import { parseISO } from "date-fns";

export const TIMESTAMPS_BEFORE = `NOW() - INTERVAL '12 HOURS'`;
export const PORTNET_TIMESTAMPS_UPPER_LIMIT = `NOW() + INTERVAL '14 DAYS'`;

const OLD_TIMESTAMP_INTERVAL = "7 days";

export interface DbTimestamp {
    readonly event_type: EventType;
    readonly event_time: Date;
    readonly event_time_confidence_lower?: string;
    readonly event_time_confidence_lower_diff?: number;
    readonly event_time_confidence_upper?: string;
    readonly event_time_confidence_upper_diff?: number;
    readonly event_source: string;
    readonly record_time: Date;
    readonly ship_mmsi: number;
    readonly ship_imo: number;
    readonly location_locode: string;
    readonly location_portarea?: string;
    readonly location_from_locode?: string;
    readonly portcall_id?: number;
    readonly source_id?: string;
}

export interface DbETAShip {
    readonly imo: number;
    readonly locode: string;
    readonly port_area_code?: string;
    readonly portcall_id: number;
    readonly eta: string;
}

export interface DbUpdatedTimestamp {
    readonly ship_mmsi: number;
    readonly ship_imo: number;
    readonly location_locode: string;
}

export interface DbTimestampIdAndLocode {
    readonly id: number;
    readonly locode: string;
}

export interface DbImo {
    readonly imo: number;
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
           $10,
           $11,
           $12,
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
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        CASE WHEN pe.event_source = '${EventSource.PORTNET}'
            THEN pe.event_time < ${PORTNET_TIMESTAMPS_UPPER_LIMIT}
            ELSE TRUE
        END
        AND
        (pe.location_locode = $1 OR (pe.location_from_locode = $1 AND pe.event_source = '${EventSource.PILOTWEB}'))
    ORDER by pe.event_time
`;

const SELECT_PORTNET_ETA_SHIP_IMO_BY_LOCODE = `
    SELECT DISTINCT
        pe.ship_imo AS imo, 
        pe.location_locode AS locode,
        pe.location_portarea AS port_area_code,
        pe.location_from_locode,
        pe.portcall_id,
        pe.event_time AS eta
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
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
          pe.event_time < NOW() + INTERVAL '84 HOUR' AND
          pe.event_type = 'ETA' AND
          pe.event_source = 'Portnet' AND
          pe.location_locode IN ($1:list) AND
          pad.ata IS NULL AND
          pc.port_call_timestamp > NOW() - INTERVAL '3 DAYS'
`;

const SELECT_VTS_A_SHIP_TOO_CLOSE_TO_PORT = `
    SELECT DISTINCT
        pe.ship_imo AS imo
    FROM port_call_timestamp pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM port_call_timestamp px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.event_source = pe.event_source AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
          pe.portcall_id IN ($1:list) AND
          pe.event_type = '${EventType.ETA}' AND
          pe.event_source = '${EventSource.AWAKE_AI}' AND
          pe.event_time < NOW() + (${DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES} || ' MINUTE')::INTERVAL
`.trim();

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
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        CASE WHEN pe.event_source = '${EventSource.PORTNET}'
            THEN pe.event_time < ${PORTNET_TIMESTAMPS_UPPER_LIMIT}
            ELSE TRUE
        END 
        AND
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
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        CASE WHEN pe.event_source = '${EventSource.PORTNET}'
            THEN pe.event_time < ${PORTNET_TIMESTAMPS_UPPER_LIMIT}
            ELSE TRUE
        END
        AND
        pe.ship_imo = $1
    ORDER by pe.event_time
`;

const SELECT_BY_SOURCE = `
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
                  CASE WHEN px.portcall_id IS NOT NULL AND pe.portcall_id IS NOT NULL
                  THEN px.portcall_id = pe.portcall_id
                  ELSE DATE(px.event_time) = DATE(pe.event_time)
                  END
          ) AND
        pe.event_time > ${TIMESTAMPS_BEFORE} AND
        CASE WHEN pe.event_source = '${EventSource.PORTNET}'
            THEN pe.event_time < ${PORTNET_TIMESTAMPS_UPPER_LIMIT}
            ELSE TRUE
        END
        AND
        pe.event_source = $1
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

const FIND_PORTCALL_ID_SQL = `
    SELECT pc.port_call_id
    FROM public.port_call pc
    JOIN public.port_area_details pac ON pac.port_call_id = pc.port_call_id
    WHERE (
        pc.mmsi = COALESCE(
            $1,
            (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE imo = $2),
            (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE imo_lloyds = $2)
        )
        OR
        pc.imo_lloyds = COALESCE(
            $2,
            (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE mmsi = $1),
            (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE mmsi = $1)
        )
    ) AND pc.port_to_visit = $3::CHARACTER VARYING(5)
    AND
        CASE
            WHEN $4 = 'ETA' THEN pac.eta >= NOW()
            WHEN $4 = 'ETD' THEN pac.etd >= NOW()
            WHEN $4 = 'ATA' THEN pac.ata <= NOW()
            WHEN $4 = 'ATD' THEN pac.atd <= NOW()
        END
    ORDER BY
        CASE
        WHEN $4 = 'ETA' THEN ABS(EXTRACT(EPOCH FROM pac.eta - $5))
        WHEN $4 = 'ETD' THEN ABS(EXTRACT(EPOCH FROM pac.etd - $5))
        WHEN $4 = 'ATA' THEN ABS(EXTRACT(EPOCH FROM pac.ata - $5))
        WHEN $4 = 'ATD' THEN ABS(EXTRACT(EPOCH FROM pac.atd - $5))
        END
    LIMIT 1
`;

const FIND_MMSI_BY_IMO_SQL = `
    SELECT COALESCE(
        (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE imo = $1),
        (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM public.port_call WHERE imo_lloyds = $1)
    ) AS mmsi
`.trim();

const FIND_IMO_BY_MMSI_SQL = `
    SELECT COALESCE(
        (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM public.vessel WHERE mmsi = $1),
        (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) AS imo FROM public.port_call WHERE mmsi = $1)
    ) AS imo
`.trim();

const DELETE_OLD_TIMESTAMPS_SQL = `
    WITH deleted AS (
        DELETE FROM port_call_timestamp WHERE event_time < now() - INTERVAL '${OLD_TIMESTAMP_INTERVAL}' RETURNING *
    ) SELECT COUNT(*) FROM deleted
`.trim();

const DELETE_OLD_PILOTAGES_SQL = `
    WITH deleted AS (
        DELETE FROM pilotage WHERE pilotage_end_time < NOW() - INTERVAL '${OLD_TIMESTAMP_INTERVAL}' RETURNING *
    ) SELECT COUNT(*) FROM deleted
`.trim();

export function updateTimestamp(
    db: DTDatabase | DTTransaction,
    timestamp: ApiTimestamp
): Promise<DbUpdatedTimestamp | null> {
    const ps = new PreparedStatement({
        name: "update-timestamps",
        text: INSERT_ESTIMATE_SQL
    });
    return db.oneOrNone(ps, createUpdateValues(timestamp));
}

export function removeTimestamps(
    db: DTDatabase | DTTransaction,
    source: string,
    sourceIds: string[]
): Promise<number[]> {
    if (sourceIds.length > 0) {
        return db
            .manyOrNone(REMOVE_TIMESTAMPS_SQL, [source, sourceIds])
            .then((array: Identifiable<number>[]) => array.map((object) => object.id));
    }

    return Promise.resolve([]);
}

export function findByLocode(db: DTDatabase, locode: string): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: "find-by-locode",
        text: SELECT_BY_LOCODE,
        values: [locode.toUpperCase()]
    });
    return db.tx((t) => t.manyOrNone(ps));
}

export function findByMmsi(db: DTDatabase, mmsi: number): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: "find-by-mmsi",
        text: SELECT_BY_MMSI,
        values: [mmsi]
    });
    return db.tx((t) => t.manyOrNone(ps));
}

export function findByImo(db: DTDatabase, imo: number): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: "find-by-imo",
        text: SELECT_BY_IMO,
        values: [imo]
    });
    return db.tx((t) => t.manyOrNone(ps));
}

export function findBySource(db: DTDatabase, source: string): Promise<DbTimestamp[]> {
    const ps = new PreparedStatement({
        name: "find-by-source",
        text: SELECT_BY_SOURCE,
        values: [source]
    });
    return db.tx((t) => t.manyOrNone(ps));
}

export function findPortnetETAsByLocodes(db: DTDatabase, locodes: string[]): Promise<DbETAShip[]> {
    // Prepared statement use not possible due to dynamic IN-list
    return db.tx((t) => t.manyOrNone(SELECT_PORTNET_ETA_SHIP_IMO_BY_LOCODE, [locodes]));
}

export function findVtsShipImosTooCloseToPortByPortCallId(
    db: DTDatabase,
    portcallIds: number[]
): Promise<DbImo[]> {
    // Prepared statement use not possible due to dynamic IN-list
    return db.tx((t) => t.manyOrNone(SELECT_VTS_A_SHIP_TOO_CLOSE_TO_PORT, [portcallIds]));
}

export function findPortnetTimestampsForAnotherLocode(
    db: DTDatabase | DTTransaction,
    portcallId: number,
    locode: string
): Promise<DbTimestampIdAndLocode[]> {
    const ps = new PreparedStatement({
        name: "find-by-portcall-id-and-locode",
        text: SELECT_BY_PORTCALL_ID_AND_LOCODE,
        values: [portcallId, locode]
    });
    return db.manyOrNone(ps);
}

export function deleteById(db: DTDatabase | DTTransaction, id: number): Promise<null> {
    const ps = new PreparedStatement({
        name: "delete-by-id",
        text: DELETE_BY_ID,
        values: [id]
    });
    return db.none(ps);
}

export async function findPortcallId(
    db: DTDatabase,
    locode: string,
    eventType: EventType,
    eventTime: Date,
    mmsi?: number,
    imo?: number
): Promise<number | undefined> {
    const ps = new PreparedStatement({
        name: "find-portcall-id",
        text: FIND_PORTCALL_ID_SQL,
        values: [mmsi, imo, locode, eventType, eventTime]
    });
    const ret = await db.oneOrNone<{ port_call_id: number }>(ps);
    if (ret) {
        return ret.port_call_id;
    }
    return undefined;
}

export async function findMmsiByImo(
    db: DTDatabase | DTTransaction,
    imo?: number
): Promise<number | undefined> {
    if (imo) {
        const mmsi = await db.oneOrNone<{ mmsi: number }>(FIND_MMSI_BY_IMO_SQL, [imo]);
        if (mmsi?.mmsi) {
            return mmsi.mmsi;
        }
    }

    return undefined;
}

export async function findImoByMmsi(
    db: DTDatabase | DTTransaction,
    mmsi?: number
): Promise<number | undefined> {
    if (mmsi) {
        const imo = await db.oneOrNone<{ imo: number }>(FIND_IMO_BY_MMSI_SQL, [mmsi]);
        if (imo?.imo) {
            return imo.imo;
        }
    }

    return undefined;
}

export async function deleteOldTimestamps(db: DTTransaction): Promise<number> {
    const ret = await db.one<Countable>(DELETE_OLD_TIMESTAMPS_SQL);
    return ret.count;
}

export async function deleteOldPilotages(db: DTTransaction): Promise<number> {
    const ret = await db.one<Countable>(DELETE_OLD_PILOTAGES_SQL);
    return ret.count;
}

export function createUpdateValues(e: ApiTimestamp): unknown[] {
    return [
        e.eventType, // event_type
        parseISO(e.eventTime), // event_time
        e.eventTimeConfidenceLower,
        e.eventTimeConfidenceLowerDiff ? Math.floor(e.eventTimeConfidenceLowerDiff) : undefined,
        e.eventTimeConfidenceUpper,
        e.eventTimeConfidenceUpperDiff ? Math.ceil(e.eventTimeConfidenceUpperDiff) : undefined,
        e.source, // event_source
        parseISO(e.recordTime), // record_time
        e.location.port, // location_locode
        e.ship.mmsi && e.ship.mmsi !== 0 ? e.ship.mmsi : undefined, // ship_mmsi
        e.ship.imo && e.ship.imo !== 0 ? e.ship.imo : undefined, // ship_imo,
        e.portcallId,
        e.location.portArea,
        e.location.from,
        e.sourceId // source_id
    ];
}
