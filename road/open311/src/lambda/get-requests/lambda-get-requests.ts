import { findAll } from "../../service/requests.js";
import type { ServiceRequest } from "../../model/service-request.js";

export const handler = (event: { extensions: string }): Promise<ServiceRequest[]> => {
    return findAll(/true/.test(event.extensions));
};
