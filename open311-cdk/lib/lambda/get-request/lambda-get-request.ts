import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-requests";

export const handler = async (event: any) : Promise <any> => {
    const serviceRequestId = event['request_id'] as string | null;

    if (!serviceRequestId) {
        throw new Error(errorMessages.NO_REQUEST_ID);
    }

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const request = await find(db, serviceRequestId);
    db.$pool.end();

    if (!request) {
        throw new Error(errorMessages.NOT_FOUND);
    }

    return request;
};

export const errorMessages = {
    NOT_FOUND: 'NOT_FOUND',
    NO_REQUEST_ID: 'NO_REQUEST_ID'
};