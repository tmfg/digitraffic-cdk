import * as pgPromise from "pg-promise";
import {insert} from "../../lib/db/db-requests";
import {ServiceRequest} from "../../lib/model/service-request";

export function insertServiceRequest(db: pgPromise.IDatabase<any, any>): Promise<void> {
    return insert(db, []);
}

export function newServiceRequest(): ServiceRequest {
    return {
        service_request_id: "SRQ" + Math.random().toFixed(10).split('.')[1],
        status: "some status",
        status_notes: "status_notes",
        service_name: "service_name",
        service_code: "123",
        description: "some description",
        agency_responsible: undefined,
        service_notice: undefined,
        requested_datetime: new Date(),
        updated_datetime: undefined,
        expected_datetime: undefined,
        address: undefined,
        address_id: undefined,
        zipcode: undefined,
        geometry: undefined,
        media_url: undefined
    };
}
