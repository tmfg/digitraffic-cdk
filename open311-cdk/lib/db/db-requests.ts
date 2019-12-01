import {ServiceRequest, ServiceRequestStatus} from "../model/service-request";
import * as pgPromise from "pg-promise";

export function findAll(db: pgPromise.IDatabase<any, any>): Promise<ServiceRequest[]> {
    return db.manyOrNone(`
        SELECT service_request_id,
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
               ST_X(geometry) AS long,
               ST_Y(geometry) AS lat,
               media_url
        FROM open311_service_request
    `);
}

export function insert(db: pgPromise.IDatabase<any, any>, serviceRequests: ServiceRequest[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = serviceRequests.map(serviceRequest => {
            return t.none(
                `INSERT INTO open311_service_request(service_request_id,
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
                                   media_url)
                           VALUES ($(service_request_id),
                                   $(status),
                                   $(status_notes),
                                   $(service_name),
                                   $(service_code),
                                   $(description),
                                   $(agency_responsible),
                                   $(service_notice),
                                   $(requested_datetime),
                                   $(updated_datetime),
                                   $(expected_datetime),
                                   $(address),
                                   $(address_id),
                                   $(zipcode),
                                   $(geometry),
                                   $(media_url))`, serviceRequest);
        });
        return t.batch(queries);
    });
}

export function update(db: pgPromise.IDatabase<any, any>, serviceRequests: ServiceRequest[]): Promise<void> {
    return db.tx(t => {
        const queries: any[] = serviceRequests.map(serviceRequest => {
            if (serviceRequest.status == ServiceRequestStatus.closed) {
                return t.none('DELETE FROM open311_service_request WHERE service_request_id = $1', serviceRequest.service_request_id);
            } else {
                return t.none(`
                    UPDATE open311_service_request SET
                       status_notes = $(status_notes),
                       service_name = $(service_name),
                       service_code = $(service_code),
                       description = $(description),
                       agency_responsible = $(agency_responsible),
                       service_notice = $(service_notice),
                       requested_datetime = $(requested_datetime),
                       updated_datetime = $(updated_datetime),
                       expected_datetime = $(expected_datetime),
                       address = $(address),
                       address_id = $(address_id),
                       zipcode = $(zipcode),
                       geometry = $(geometry),
                       media_url = $(media_url)
                    WHERE service_request_id = $(service_request_id)
                `, serviceRequest);
            }
        });
        return t.batch(queries);
    });
}
