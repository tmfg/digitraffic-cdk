import {findAll} from "../../service/requests";
import {ServiceRequest} from "../../model/service-request";

export const handler = (event: {extensions: string}): Promise<ServiceRequest[]> => {
    return findAll(/true/.test(event.extensions));
};
