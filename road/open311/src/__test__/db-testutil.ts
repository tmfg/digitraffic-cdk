import type { ServiceRequest } from "../model/service-request.js";
import * as RequestsDb from "../db/requests.js";
import { dbTestBase as commonDbTestBase } from "@digitraffic/common/dist/test/db-testutils";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

export function dbTestBase(fn: (db: DTDatabase) => void): ReturnType<typeof commonDbTestBase> {
    return commonDbTestBase(fn, truncate, "road", "road", "127.0.0.1:54322/road");
}

export async function truncate(db: DTDatabase): Promise<void> {
    await db.tx(async (t) => {
        await t.batch([
            db.none("DELETE FROM open311_service_request"),
            db.none("DELETE FROM open311_service_request_state"),
            db.none("DELETE FROM open311_service"),
            db.none("DELETE FROM open311_subject"),
            db.none("DELETE FROM open311_subsubject")
        ]);
    });
}

export async function insertServiceRequest(db: DTDatabase, serviceRequests: ServiceRequest[]): Promise<void> {
    await db.tx(async (t) => {
        const queries: Promise<null>[] = serviceRequests.map((serviceRequest) => {
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
                   $25)`,
                RequestsDb.createEditObject(serviceRequest)
            );
        });
        await t.batch(queries);
    });
}
