import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';
import {ServiceRequest} from "../../model/service-request";
import {insert} from "../../db/db-requests";

function invalidRequest(): object {
    return {statusCode: 400, body: 'Invalid request'};
}

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    if (!event.body) {
        return invalidRequest();
    }

    const obj = JSON.parse(event.body);
    const serviceRequests: ServiceRequest[] = Array.isArray(obj) ? obj as ServiceRequest[] : [obj];

    if (serviceRequests.length == 0) {
        return invalidRequest();
    }

    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await insert(db, serviceRequests);

    db.$pool.end();

    return {statusCode: 201, body: 'Created'};
};
