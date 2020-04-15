import * as pgPromise from "pg-promise";
import {
    findAll as dbFindAll,
    find as dbFind,
    doDelete as dbDelete
} from '../db/db-requests';
import {ServiceRequest, ServiceRequestWithExtensions, ServiceRequestWithExtensionsDto} from "../model/service-request";

export async function findAll(extensions: Boolean, db: pgPromise.IDatabase<any, any>): Promise<ServiceRequest[]> {
    const requests =await dbFindAll(db);
    if (!extensions) {
        return requests.map(r => toServiceRequest(r));
    } else {
        return requests.map(r => toServiceRequestWithExtensions(r));
    }
}

export async function find(
    serviceRequestId: string,
    extensions: boolean,
    db: pgPromise.IDatabase<any, any>
): Promise<ServiceRequest | null> {
    const r = await dbFind(db, serviceRequestId)
    if (!r) {
        return null;
    }
    return extensions ? toServiceRequestWithExtensions(r) : toServiceRequest(r);
}

export async function doDelete(
    serviceRequestId: string,
    db: pgPromise.IDatabase<any, any>
): Promise<void> {
    return await dbDelete(serviceRequestId, db);
}

export function toServiceRequestWithExtensions(r: ServiceRequestWithExtensions): ServiceRequestWithExtensionsDto {
    return {
        ...toServiceRequest(r), ...{
            extended_attributes: {
                status_id: r.status_id,
                vendor_status: r.vendor_status,
                title: r.title,
                service_object_id: r.service_object_id,
                service_object_type: r.service_object_type,
                media_urls: r.media_urls
            }
        }
    };
}

export function toServiceRequest(r: ServiceRequestWithExtensions): ServiceRequest {
    // destructuring is nicer to the eye but being explicit is safer in the long run
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
        media_url: r.media_url
    };
}
