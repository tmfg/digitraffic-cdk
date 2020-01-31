import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-services";

export const handler = async (event: any) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;

    if (!serviceId) {
        throw new Error(errorMessages.NO_SERVICE_ID);
    }

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const service = await find(db, serviceId as string);
    db.$pool.end();

    if (!service) {
        throw new Error(errorMessages.NOT_FOUND);
    }

    return service;
};

export const errorMessages = {
    NOT_FOUND: 'NOT_FOUND',
    NO_SERVICE_ID: 'NO_SERVICE_ID'
};