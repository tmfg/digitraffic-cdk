import {
  doDelete as dbDelete,
  find as dbFind,
  findAll as dbFindAll,
  update as dbUpdate,
} from "../db/requests.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type {
  ServiceRequest,
  ServiceRequestWithExtensions,
  ServiceRequestWithExtensionsDto,
} from "../model/service-request.js";
import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";

export function findAll(extensions: boolean): Promise<ServiceRequest[]> {
  return inDatabase(async (db: DTDatabase) => {
    const requests = await dbFindAll(db);
    if (!extensions) {
      return requests.map((r) => toServiceRequest(r));
    } else {
      return requests.map((r) => toServiceRequestWithExtensions(r));
    }
  });
}

// eslint-disable-next-line @rushstack/no-new-null
export function find(
  serviceRequestId: string,
  extensions: boolean,
): Promise<ServiceRequest | null> {
  return inDatabase(async (db: DTDatabase) => {
    const r = await dbFind(serviceRequestId, db);
    if (!r) {
      return null;
    }
    return extensions ? toServiceRequestWithExtensions(r) : toServiceRequest(r);
  });
}

// eslint-disable-next-line @rushstack/no-new-null
export function doDelete(serviceRequestId: string): Promise<null> {
  return inDatabase((db: DTDatabase) => {
    return dbDelete(serviceRequestId, db);
  });
}

export function update(
  requests: ServiceRequestWithExtensions[],
): Promise<void> {
  const start = Date.now();
  return inDatabase((db: DTDatabase) => {
    return dbUpdate(requests, db);
  })
    .then((a) => {
      const end = Date.now();
      logger.info({
        method: "open311ServiceRequests.update",
        customUpdatedCount: a.length,
        customTookMs: end - start,
      });
    })
    .catch((error) => {
      logger.error({
        method: "open311ServiceRequests.update",
        error: error,
      });
      throw error;
    });
}

export function toServiceRequestWithExtensions(
  r: ServiceRequestWithExtensions,
): ServiceRequestWithExtensionsDto {
  return {
    ...toServiceRequest(r),
    ...{
      extended_attributes: {
        status_id: r.status_id,
        vendor_status: r.vendor_status,
        title: r.title,
        service_object_id: r.service_object_id,
        service_object_type: r.service_object_type,
        media_urls: r.media_urls,
        subject_id: r.subject_id,
        subSubject_id: r.subSubject_id,
      },
    },
  };
}

export function toServiceRequest(
  r: ServiceRequestWithExtensions,
): ServiceRequest {
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
    media_url: r.media_url,
  };
}
