import {APIGatewayEvent} from 'aws-lambda';
import {update} from "../../db/db-requests";
import {invalidRequest} from "../../request-util";
import {initDb} from 'digitraffic-lambda-postgres/database';

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    const serviceRequestId = event.pathParameters?.['service_id'];

    if (!serviceRequestId || !event.body) {
        return invalidRequest();
    }

    const serviceRequest = JSON.parse(event.body);

    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    await update(db, [Object.assign(serviceRequest, {
        service_request_id: serviceRequestId
    })]);

    db.$pool.end();

    return {statusCode: 200, body: 'Updated'};
};
