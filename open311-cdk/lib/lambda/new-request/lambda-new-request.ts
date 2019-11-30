import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';
import {ServiceRequest} from "../../model/service-request";
import {insert} from "../../db/db-requests";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    if (!event.body) {
        return {statusCode: 400, body: 'Invalid request'};
    }

    const obj = JSON.parse(event.body);
    const serviceRequests: ServiceRequest[] = Array.isArray(obj) ? obj as ServiceRequest[] : [obj];
    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await insert(db, serviceRequests);

    return {statusCode: 201, body: 'Created'};
};
