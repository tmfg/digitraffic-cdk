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
        agency_responsible: "some agency",
        service_notice: "some notice",
        requested_datetime: new Date(),
        updated_datetime: new Date(),
        expected_datetime: new Date(),
        address: "some address",
        address_id: "2",
        zipcode: "123456",
        geometry: "POINT(0 0)",
        media_url: "some url"
    };
}
