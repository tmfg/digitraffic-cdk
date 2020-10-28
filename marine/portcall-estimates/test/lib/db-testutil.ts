import {IDatabase, ITask} from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {ApiEstimate} from "../../lib/estimates/model/estimate";
import {createUpdateValues, DbEstimate} from "../../lib/estimates/db/db-estimates";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {SUBSCRIPTIONS_TABLE_NAME} from "../../lib/subscriptions/db/db-subscriptions";
import {PortAreaDetails, PortCall, Vessel, VesselLocation} from "./testdata";

export function inTransaction(db: IDatabase<any, any>, fn: (t: ITask<any>) => void) {
    return async () => {
        await db.tx(async (t: any) => await fn(t));
    };
}

export function dbTestBase(fn: (db: IDatabase<any, any>) => void) {
    return () => {
        const db: IDatabase<any, any> = initDbConnection('marine', 'marine', 'localhost:54321/marine', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'marine';
            process.env.DB_PASS = 'marine';
            process.env.DB_URI = 'localhost:54321/marine';
            await truncate(db);
        });

        afterAll(async () => {
//            await truncate(db);
            db.$pool.end();
        });

        beforeEach(async () => {
            await truncate(db);
        });

        // @ts-ignore
        fn(db);
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
    const items = await ddb.scan({
        TableName: SUBSCRIPTIONS_TABLE_NAME
    }).promise();
    return Promise.all(items.Items!!.map(s =>
        ddb.delete({
            TableName: SUBSCRIPTIONS_TABLE_NAME,
            Key: {
                PhoneNumber: s.PhoneNumber,
                Locode: s.Locode
            }
        }).promise()
    ));
}

export async function truncate(db: IDatabase<any, any>): Promise<any> {
    return db.tx(t => {
        return Promise.all([
            db.none('DELETE FROM portcall_estimate'),
            db.none('DELETE FROM vessel'),
            db.none('DELETE FROM vessel_location'),
            db.none('DELETE FROM port_area_details'),
            db.none('DELETE FROM port_call')
        ]);
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

export function insertPortAreaDetails(db: IDatabase<any, any>, p: PortAreaDetails) {
    return db.tx(t => {
        db.none(`
            INSERT INTO port_area_details(
                port_area_details_id,
                port_call_id,
                ata
            ) VALUES (
                $(port_area_details_id),
                $(port_call_id),
                $(ata)
            )
        `, p);
    });
}

export function insertPortCall(db: IDatabase<any, any>, p: PortCall) {
    return db.tx(t => {
        db.none(`
            INSERT INTO port_call(
                port_call_id,
                radio_call_sign,
                radio_call_sign_type,
                vessel_name
            ) VALUES (
                $(port_call_id),
                $(radio_call_sign),
                $(radio_call_sign_type),
                $(vessel_name)
            )
        `, p);
    });
}