import { find } from "../../service/requests.js";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import type { ServiceRequest } from "../../model/service-request.js";

const stringTrueRegex = /true/;

export const handler = async (event: GetRequestEvent): Promise<ServiceRequest> => {
    const request = await find(event.request_id, stringTrueRegex.test(event.extensions));
    if (!request) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return request;
};

interface GetRequestEvent {
    readonly request_id: string;
    readonly extensions: string;
}
