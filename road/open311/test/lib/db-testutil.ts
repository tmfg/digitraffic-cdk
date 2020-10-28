import * as pgPromise from "pg-promise";
import {initDbConnection} from "digitraffic-lambda-postgres/database";
import {ServiceRequest} from "../../lib/model/service-request";
import {createEditObject} from "../../lib/db/db-requests";

export function dbTestBase(fn: (db: pgPromise.IDatabase<any, any>) => void) {
    return () => {
        const db: pgPromise.IDatabase<any, any> = initDbConnection('road', 'road', 'localhost:54322/road', {
            noWarnings: true // ignore duplicate connection warning for tests
        });

        beforeAll(async () => {
            process.env.DB_USER = 'road';
            process.env.DB_PASS = 'road';
            process.env.DB_URI = 'localhost:54322/road';
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

export async function truncate(db: pgPromise.IDatabase<any, any>): Promise<null> {
    return db.tx(t => {
       return t.batch([
           db.none('DELETE FROM open311_service_request'),
           db.none('DELETE FROM open311_service_request_state'),
           db.none('DELETE FROM open311_service'),
           db.none('DELETE FROM open311_subject'),
           db.none('DELETE FROM open311_subsubject')
       ]);
    });
}

export function insertServiceRequest(db: pgPromise.IDatabase<any, any>, serviceRequests: ServiceRequest[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = serviceRequests.map(serviceRequest => {
            return t.none(
                `INSERT INTO open311_service_request(
                     service_request_id,
                     status,
                     status_notes,
                     service_name,
                     service_code,
                     description,
                     agency_responsible,
                     service_notice,
                     requested_datetime,
                     updated_datetime,
                     expected_datetime,
                     address,
                     address_id,
                     zipcode,
                     geometry,
                     media_url,
                     status_id,
                     vendor_status,
                     title,
                     service_object_id,
                     service_object_type,
                     media_urls,
                     subject_id,
                     subsubject_id)
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
                   $13,
                   $14,
                   ST_POINT($15::numeric, $16::numeric),
                   $17,
                   $18,
                   $19,
                   $20,
                   $21,
                   $22,
                   $23,
                   $24,
                   $25)`, createEditObject(serviceRequest));
        });
        return t.batch(queries);
    });
}
