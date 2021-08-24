import {find} from "../../service/requests";
import {NOT_FOUND_MESSAGE} from 'digitraffic-common/api/errors';

const stringTrueRegex = /true/;

export const handler = async (
    event: GetRequestEvent
) : Promise <any> => {
    const request = await find(event.request_id,
        stringTrueRegex.test(event.extensions));
    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return request;
};

interface GetRequestEvent {
    readonly request_id: string,
    readonly extensions: string
}