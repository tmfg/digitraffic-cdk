import {APIGatewayEvent} from 'aws-lambda';
import {initDb} from 'digitraffic-lambda-postgres/database';
import {findAll} from "../../db/db-services";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    const db = initDb(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const services = await findAll(db);

    db.$pool.end();

    return {statusCode: 200, body: JSON.stringify(services)};
};
