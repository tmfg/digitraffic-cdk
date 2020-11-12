import {IDatabase} from "pg-promise";
import {ApiEstimate, EventType} from "../model/estimate";
import moment from "moment";
import {newPreparedStatement} from "digitraffic-lambda-postgres/database";

export const ESTIMATES_BEFORE = `CURRENT_DATE - INTERVAL '12 HOURS'`;
export const ESTIMATES_IN_THE_FUTURE = `CURRENT_DATE + INTERVAL '3 DAYS'`;

export interface DbEstimate {
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
    readonly portcall_id?: number
}

export interface DbETAShip {
    readonly imo: number
    readonly locode: string
    readonly port_area_code?: string
    readonly portcall_id: number
}

const INSERT_ESTIMATE_SQL = `
    INSERT INTO portcall_estimate(
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
        portcall_id
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
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM vessel WHERE imo = $11),
               (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE imo_lloyds = $11)
           ),
           COALESCE(
               $11,
               (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM vessel WHERE mmsi = $10),
               (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE mmsi = $10)
           ),
           COALESCE(
            $12,
            (
                SELECT pc.port_call_id
                FROM port_call pc
                JOIN port_area_details pac ON pac.port_call_id = pc.port_call_id
                WHERE
                    (
                        pc.mmsi = COALESCE(
                                $10,
                                (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY timestamp DESC) FROM vessel WHERE imo = $11),
                                (SELECT DISTINCT FIRST_VALUE(mmsi) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE imo_lloyds = $11)
                        )
                        OR
                        pc.imo_lloyds = COALESCE(
                                $11,
                                (SELECT DISTINCT FIRST_VALUE(imo) OVER (ORDER BY timestamp DESC) FROM vessel WHERE mmsi = $10),
                                (SELECT DISTINCT FIRST_VALUE(imo_lloyds) OVER (ORDER BY port_call_timestamp DESC) FROM port_call WHERE mmsi = $10)
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
           )
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
        pe.portcall_id
    FROM portcall_estimate pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM portcall_estimate px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
          pe.event_time > ${ESTIMATES_BEFORE} AND
          pe.event_time < ${ESTIMATES_IN_THE_FUTURE} AND
          pe.location_locode = $1
    ORDER by pe.event_time
`;

const SELECT_ETA_SHIP_IMO_BY_LOCODE = `
    SELECT DISTINCT
        pe.ship_imo AS imo, 
        pe.location_locode AS locode,
        pe.portcall_id,
        pad.port_area_code
    FROM portcall_estimate pe
    JOIN port_call pc ON pc.port_call_id = pe.portcall_id
    JOIN port_area_details pad on pad.port_call_id = pe.portcall_id
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM portcall_estimate px
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
        pe.portcall_id
    FROM portcall_estimate pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM portcall_estimate px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
        pe.event_time > ${ESTIMATES_BEFORE} AND
        pe.event_time < ${ESTIMATES_IN_THE_FUTURE} AND
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
        pe.portcall_id
    FROM portcall_estimate pe
    WHERE pe.record_time =
          (
              SELECT MAX(px.record_time) FROM portcall_estimate px
              WHERE px.event_type = pe.event_type AND
                  px.location_locode = pe.location_locode AND
                  px.ship_mmsi = pe.ship_mmsi AND
                  px.event_source = pe.event_source AND
                  px.portcall_id = pe.portcall_id
          ) AND
        pe.event_time > ${ESTIMATES_BEFORE} AND
        pe.event_time < ${ESTIMATES_IN_THE_FUTURE} AND
        pe.ship_imo = $1
    ORDER by pe.event_time
`;

const INSERT_ESTIMATE_PS = newPreparedStatement('update-estimates', INSERT_ESTIMATE_SQL);

export function updateEstimate(db: IDatabase<any, any>, estimate: ApiEstimate): Promise<any> {
    return db.oneOrNone(INSERT_ESTIMATE_PS, createUpdateValues(estimate));
}

const FIND_BY_LOCODE_PS = newPreparedStatement('find-by-locode', SELECT_BY_LOCODE);

export function findByLocode(
    db: IDatabase<any, any>,
    locode: string
): Promise<DbEstimate[]> {
    FIND_BY_LOCODE_PS.values = [locode];
    return db.tx(t => t.manyOrNone(FIND_BY_LOCODE_PS));
}

const FIND_BY_MMSI_PS = newPreparedStatement('find-by-mmsi', SELECT_BY_MMSI);

export function findByMmsi(
    db: IDatabase<any, any>,
    mmsi: number,
): Promise<DbEstimate[]> {
    FIND_BY_MMSI_PS.values = [mmsi];
    return db.tx(t => t.manyOrNone(FIND_BY_MMSI_PS));
}

const FIND_BY_IMO_PS = newPreparedStatement('find-by-imo', SELECT_BY_IMO);

export function findByImo(
    db: IDatabase<any, any>,
    imo: number,
): Promise<DbEstimate[]> {
    FIND_BY_IMO_PS.values = [imo];
    return db.tx(t => t.manyOrNone(FIND_BY_IMO_PS));
}

export function findETAsByLocodes(
    db: IDatabase<any, any>,
    locodes: string[]
): Promise<DbETAShip[]> {
    // Prepared statement use not possible due to dynamic IN-list
    return db.tx(t => t.manyOrNone(SELECT_ETA_SHIP_IMO_BY_LOCODE, [locodes]));
}

export function createUpdateValues(e: ApiEstimate): any[] {
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
        e.ship.mmsi && e.ship.mmsi != 0 ? e.ship.mmsi : undefined,  // ship_mmsi
        e.ship.imo && e.ship.imo != 0 ? e.ship.imo : undefined,  // ship_imo,
        e.portcallId
    ];
}

function diffDuration(eventTime: string, confLower: string): number {
    return moment(eventTime).valueOf() - moment(eventTime).subtract(moment.duration(confLower)).valueOf();
}
