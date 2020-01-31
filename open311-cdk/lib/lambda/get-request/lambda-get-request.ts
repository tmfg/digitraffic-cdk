import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../db/db-requests";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';

export const handler = async (event: any) : Promise <any> => {
    const serviceRequestId = event['request_id'] as string;

    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const request = await find(db, serviceRequestId);
    db.$pool.end();

    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }

    return request;
};
