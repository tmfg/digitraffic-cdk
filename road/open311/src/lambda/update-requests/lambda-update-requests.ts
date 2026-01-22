import { LambdaProxyResponseBuilder } from "@digitraffic/common/dist/aws/types/lambda-proxy-types";
import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import type {
  ServiceRequestWithExtensions,
  ServiceRequestWithExtensionsDto,
} from "../../model/service-request.js";
import * as RequestsService from "../../service/requests.js";

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return LambdaProxyResponseBuilder.badRequest();
  }

  const obj = JSON.parse(
    event.body,
  ) as unknown as ServiceRequestWithExtensionsDto;
  const serviceRequests = Array.isArray(obj)
    ? (obj as ServiceRequestWithExtensionsDto[])
    : [obj];

  if (serviceRequests.length === 0) {
    return LambdaProxyResponseBuilder.badRequest();
  }

  await RequestsService.update(
    serviceRequests.map((sr) => toServiceRequestWithExtensions(sr)),
  );

  return { statusCode: 200, body: "Ok" };
};

function toServiceRequestWithExtensions(
  r: ServiceRequestWithExtensionsDto,
): ServiceRequestWithExtensions {
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
    media_urls: r.extended_attributes?.media_urls,
  };
}
