import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {find} from "../../service/requests";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {IDatabase} from "pg-promise";

const stringTrueRegex = /true/;
let db: IDatabase<any, any>;

export const handler = async (
    event: GetRequestEvent,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
) : Promise <any> => {
    db = db ? db : dbParam ? dbParam : initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );

    const request = await find(event.request_id,
        stringTrueRegex.test(event.extensions),
        db);

    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }

    return request;
};

interface GetRequestEvent {
    readonly request_id: string,
    readonly extensions: string
}