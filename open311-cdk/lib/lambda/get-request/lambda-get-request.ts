import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-requests";
import {invalidRequest, notFound} from "../../request-util";

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    const serviceRequestId = event.pathParameters?.['request_id'];

    if (!serviceRequestId) {
        return invalidRequest();
    }

    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const request = await find(db, serviceRequestId);
    db.$pool.end();

    if (!request) {
        return notFound();
    }

    return {statusCode: 200, body: JSON.stringify(request)};
};
