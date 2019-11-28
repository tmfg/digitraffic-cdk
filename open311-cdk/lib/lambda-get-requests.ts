import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    if (!event.body) {
        console.log('Invalid request');
        return { statusCode: 400, body: 'Invalid request' };
    }
    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    const requests = await db.many("SELECT * FROM open311_service_request");

    return { statusCode: 200, body: JSON.stringify(requests) };
};
