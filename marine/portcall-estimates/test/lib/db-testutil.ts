import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {ApiEstimate} from "../../lib/estimates/model/estimate";
import {createUpdateValues, DbEstimate} from "../../lib/estimates/db/db-estimates";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {SUBSCRIPTIONS_TABLE_NAME} from "../../lib/subscriptions/db/db-subscriptions";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('marine', 'marine', 'localhost:54321/marine', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'marine';
            process.env.DB_PASS = 'marine';
            process.env.DB_URI = 'localhost:54321/marine';
            await truncate(db);
        });

        afterAll(async () => {
            await truncate(db);
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
                ID: s.ID
            }
        }).promise()
    ));
}

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM portcall_estimate'),
       ]);
    });
}

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<DbEstimate[]> {
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

export function insert(db: pgPromise.IDatabase<any, any>, estimates: ApiEstimate[]) {
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