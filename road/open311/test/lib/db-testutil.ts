import * as pgPromise from "pg-promise";
import {ServiceRequest} from "../../lib/model/service-request";
import {createEditObject} from "../../lib/db/db-requests";
import {dbTestBase as commonDbTestBase} from "../../../../common/test/db-testutils";
import {IDatabase} from "pg-promise";

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'road', 'road', 'localhost:54322/road');
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
