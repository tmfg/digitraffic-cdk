import {IDatabase, ITask} from "pg-promise";
import {initDbConnection} from "../../../../common/postgres/database";
import {ApiEstimate} from "../../lib/estimates/model/estimate";
import {createUpdateValues, DbEstimate} from "../../lib/estimates/db/db-estimates";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {SUBSCRIPTIONS_TABLE_NAME} from "../../lib/subscriptions/db/db-subscriptions";
import {INFO_TABLE_NAME} from "../../lib/subscriptions/db/db-info";
import {PortAreaDetails, PortCall, Vessel, VesselLocation} from "./testdata";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}

export function dynamoDbTestBase(ddb: DocumentClient, fn: () => void) {
    return async () => {
        await truncateDynamoDb(ddb);
        await fn();
        await truncateDynamoDb(ddb);
    };
}

async function truncateDynamoDb(ddb: DocumentClient) {
    const subItems = await ddb.scan({
        TableName: SUBSCRIPTIONS_TABLE_NAME
    }).promise();
    await Promise.all(subItems.Items!!.map(s =>
        ddb.delete({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Key: {
                PhoneNumber: s.PhoneNumber,
                Locode: s.Locode
            }
        }).promise()
    ));

    const infoItems = await ddb.scan({
        TableName: INFO_TABLE_NAME
    }).promise();
    await Promise.all(infoItems.Items!!.map(s =>
        ddb.delete({
            TableName: INFO_TABLE_NAME,
            Key: {
                ID: s.ID
            }
        }).promise()
    ));
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await db.none('DELETE FROM portcall_estimate');
        await db.none('DELETE FROM vessel');
        await db.none('DELETE FROM vessel_location');
        await db.none('DELETE FROM port_area_details');
        await db.none('DELETE FROM port_call');
    });
}

export function findAll(db: IDatabase<any, any>): Promise<DbEstimate[]> {
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
        FROM portcall_estimate`);
    });
}

export function insert(db: IDatabase<any, any>, estimates: ApiEstimate[]) {
    return db.tx(t => {
        return t.batch(estimates.map(e => {
            return t.none(`
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
                    portcall_id)
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
                    $12
                )
            `, createUpdateValues(e));
        }));
    });
}

export function insertVessel(db: IDatabase<any, any>, vessel: Vessel) {
    return db.tx(t => {
        db.none(`
            INSERT INTO vessel(
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

export function insertVesselLocation(db: IDatabase<any, any>, vl: VesselLocation) {
    return db.tx(t => {
        db.none(`
            INSERT INTO vessel_location(
                mmsi,
                timestamp_ext,
                x,
                y,
                sog,
                cog,
                nav_stat,
                rot,
                pos_acc,
                raim,
                timestamp,
                heading
            ) VALUES (
                $(mmsi),
                $(timestamp_ext),
                $(x),
                $(y),
                $(sog),
                $(cog),
                $(nav_stat),
                $(rot),
                $(pos_acc),
                $(raim),
                $(timestamp),
                $(heading)
            )
        `, vl);
    });
}

export function insertPortAreaDetails(db: IDatabase<any, any>, p: PortAreaDetails): Promise<any> {
    return db.none(`
        INSERT INTO port_area_details(
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
        INSERT INTO port_call(
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