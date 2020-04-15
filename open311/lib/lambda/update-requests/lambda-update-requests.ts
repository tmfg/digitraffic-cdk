import {APIGatewayEvent} from 'aws-lambda';
import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {
    ServiceRequestWithExtensions,
    ServiceRequestWithExtensionsDto
} from "../../model/service-request";
import {update} from "../../db/db-requests";
import {invalidRequest} from "../../http-util";
import * as pgPromise from "pg-promise";

let db: pgPromise.IDatabase<any, any>;

export const handler = async (
    event: APIGatewayEvent,
    context: any,
    callback: any,
    dbParam?: pgPromise.IDatabase<any, any>
): Promise<any> => {
    if (!event.body) {
        return invalidRequest();
    }

    const obj = JSON.parse(event.body);
    const serviceRequests: ServiceRequestWithExtensionsDto[] = Array.isArray(obj) ? obj as ServiceRequestWithExtensionsDto[] : [obj];

    if (serviceRequests.length == 0) {
        return invalidRequest();
    }

    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    return await doUpdate(db, serviceRequests);
};

async function doUpdate(db: pgPromise.IDatabase<any, any>, serviceRequests: ServiceRequestWithExtensionsDto[]) {
    await update(db, serviceRequests.map(sr => toServiceRequestWithExtensions(sr)));
    return {statusCode: 200, body: 'Ok'};
}

function toServiceRequestWithExtensions(r: ServiceRequestWithExtensionsDto): ServiceRequestWithExtensions {
    return {
        service_request_id: r.service_request_id,
        status: r.status,
        status_notes: r.status_notes,
        service_name: r.service_name,
        service_code: r.service_code,
        description: r.description,
        agency_responsible: r.agency_responsible,
        service_notice: r.service_notice,
        requested_datetime: r.requested_datetime,
        updated_datetime: r.updated_datetime,
        expected_datetime: r.expected_datetime,
        address: r.address,
        address_id: r.address_id,
        zipcode: r.zipcode,
        long: r.long,
        lat: r.lat,
        media_url: r.media_url,
        status_id: r.extended_attributes?.status_id,
        vendor_status: r.extended_attributes?.vendor_status,
        title: r.extended_attributes?.title,
        service_object_id: r.extended_attributes?.service_object_id,
        service_object_type: r.extended_attributes?.service_object_type,
        media_urls: r.extended_attributes?.media_urls
    };
} 