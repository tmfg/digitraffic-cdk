import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';
import {ServiceRequest} from "../../model/service-request";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    if (!event.body) {
        console.log('Invalid request');
        return {statusCode: 400, body: 'Invalid request'};
    }

    const obj = JSON.parse(event.body);
    const serviceRequests: ServiceRequest[] = Array.isArray(obj) ? obj as ServiceRequest[] : [obj];
    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await db.tx(t => {
        const queries: any[] = serviceRequests.map(serviceRequest => {
            return t.none(`INSERT INTO open311_service_request(
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
                        media_url)
                    VALUES(
                        $(service_request_id),
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
    return {statusCode: 201, body: 'Created'};
};
