import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-services";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';

export const handler = async (event: any) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const service = await find(db, serviceId as string);
    db.$pool.end();

    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }

    return service;
};
