import {IDatabase, ITask} from "pg-promise";
import {ApiTimestamp} from "../../lib/model/timestamp";
import {createUpdateValues, DbTimestamp} from "../../lib/db/db-timestamps";
import {PortAreaDetails, PortCall, Vessel} from "./testdata";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'portactivity', 'portactivity', 'localhost:54321/marine');
}

export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM port_call_timestamp');
        await db.none('DELETE FROM public.vessel');
        await db.none('DELETE FROM public.port_area_details');
        await db.none('DELETE FROM public.port_call');
    });
}

export function findAll(db: IDatabase<any, any>): Promise<DbTimestamp[]> {
    return db.tx(t => {
       return t.manyOrNone(`
        SELECT
            event_type,
            event_time,
            event_time_confidence_lower,
            event_time_confidence_lower_diff,
            event_time_confidence_upper,
            event_time_confidence_upper_diff,
            event_source,
            record_time,
            ship_mmsi,
            ship_imo,
            location_locode,
            portcall_id
        FROM port_call_timestamp`);
    });
}

export function insert(db: IDatabase<any, any>, timestamps: ApiTimestamp[]) {
    return db.tx(t => {
        return t.batch(timestamps.map(e => {
            return t.none(`
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
                    location_portarea)
                VALUES(
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
                    $13
                )
            `, createUpdateValues(e));
        }));
    });
}

export function insertVessel(db: IDatabase<any, any>, vessel: Vessel) {
    return db.tx(t => {
        db.none(`
            INSERT INTO public.vessel(
                mmsi,
                timestamp,
                name,
                ship_type,
                reference_point_a,
                reference_point_b,
                reference_point_c,
                reference_point_d,
                pos_type,
                draught,
                imo,
                eta,
                call_sign,
                destination
            ) VALUES (
                $(mmsi),
                $(timestamp),
                $(name),
                $(ship_type),
                $(reference_point_a),
                $(reference_point_b),
                $(reference_point_c),
                $(reference_point_d),
                $(pos_type),
                $(draught),
                $(imo),
                $(eta),
                $(call_sign),
                $(destination)
            )
        `, vessel);
    });
}

export function insertPortAreaDetails(db: IDatabase<any, any>, p: PortAreaDetails): Promise<any> {
    return db.none(`
        INSERT INTO public.port_area_details(
            port_area_details_id,
            port_call_id,
            eta
        ) VALUES (
            $(port_area_details_id),
            $(port_call_id),
            $(eta)
        )
    `, p);
}

export function insertPortCall(db: IDatabase<any, any>, p: PortCall): Promise<any> {
    return db.none(`
        INSERT INTO public.port_call(
            port_call_id,
            radio_call_sign,
            radio_call_sign_type,
            vessel_name,
            port_call_timestamp,
            port_to_visit,
            mmsi,
            imo_lloyds
        ) VALUES (
            $(port_call_id),
            $(radio_call_sign),
            $(radio_call_sign_type),
            $(vessel_name),
            $(port_call_timestamp),
            $(port_to_visit),
            $(mmsi),
            $(imo_lloyds)
        )
    `, p);
}