import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    const requests = await db.many(`
        SELECT service_request_id,
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
               ST_X(geometry) AS long,
               ST_Y(geometry) AS lat,
               media_url
        FROM open311_service_request
    `);

    db.$pool.end();

    return {statusCode: 200, body: JSON.stringify(requests)};
};
