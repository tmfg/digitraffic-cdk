import {find} from "../../service/requests";
import {NOT_FOUND_MESSAGE} from '@digitraffic/common/dist/aws/types/errors';
import {ServiceRequest} from "../../model/service-request";

const stringTrueRegex = /true/;

export const handler = async (event: GetRequestEvent) : Promise <ServiceRequest> => {
    // eslint-disable-next-line camelcase
    const request = await find(event.request_id,
        stringTrueRegex.test(event.extensions));
    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return request;
};

interface GetRequestEvent {
    // eslint-disable-next-line camelcase
    readonly request_id: string,
    readonly extensions: string
}
