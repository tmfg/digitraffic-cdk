import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    find as dbFind,
    doDelete as dbDelete,
    update as dbUpdate
} from '../db/db-requests';
import {ServiceRequest, ServiceRequestWithExtensions, ServiceRequestWithExtensionsDto} from "../model/service-request";
import {inDatabase} from "digitraffic-lambda-postgres/database";

export async function findAll(
    extensions: Boolean
): Promise<ServiceRequest[]> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const requests = await dbFindAll(db);
        if (!extensions) {
            return requests.map(r => toServiceRequest(r));
        } else {
            return requests.map(r => toServiceRequestWithExtensions(r));
        }
    });
}

export async function find(
    serviceRequestId: string,
    extensions: boolean
): Promise<ServiceRequest | null> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const r =  await dbFind(serviceRequestId, db);
        if (!r) {
            return null;
        }
        return extensions ? toServiceRequestWithExtensions(r) : toServiceRequest(r);
    });
}

export async function doDelete(
    serviceRequestId: string
): Promise<void> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await dbDelete(serviceRequestId, db);
    });
}

export async function update(
    requests: ServiceRequestWithExtensions[]
): Promise<void> {
    const start = Date.now();
    return await inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(requests, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateRequests updatedCount=%d tookMs=%d", a.length, (end - start));
    }).catch(error => {
        console.error('method=updateRequests', requests);
        throw error;
    });
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
                media_urls: r.media_urls,
                subject_id: r.subject_id,
                subSubject_id: r.subSubject_id
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
