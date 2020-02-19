import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../service/requests";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';

const stringTrueRegex = /true/;

export const handler = async (event: GetRequestEvent) : Promise <any> => {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const request = await find(event.request_id,
        stringTrueRegex.test(event.extensions),
        db);
    db.$pool.end();

    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }

    return request;
};

interface GetRequestEvent {
    readonly request_id: string,
    readonly extensions: string
}