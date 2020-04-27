import {find} from "../../service/requests";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {IDatabase} from "pg-promise";

const stringTrueRegex = /true/;

export const handler = async (
    event: GetRequestEvent,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
) : Promise <any> => {
    const request = await find(event.request_id,
        stringTrueRegex.test(event.extensions),
        dbParam);
    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return request;
};

interface GetRequestEvent {
    readonly request_id: string,
    readonly extensions: string
}