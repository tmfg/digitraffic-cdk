import {APIGatewayEvent} from 'aws-lambda';
import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-services";
import {invalidRequest, notFound} from "../../request-util";

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    const serviceserviceId = event.pathParameters?.['service_id'];

    if (!serviceserviceId) {
        return invalidRequest();
    }

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const service = await find(db, serviceserviceId);
    db.$pool.end();

    if (!service) {
        return notFound();
    }

    return {statusCode: 200, body: JSON.stringify(service)};
};
