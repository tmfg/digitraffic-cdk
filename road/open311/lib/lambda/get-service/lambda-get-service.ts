import {find} from "../../service/services";
import {NOT_FOUND_MESSAGE} from '../../../../../common/api/errors';

export const handler = async (
    event: any
) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;
    const service = await find(serviceId as string);
    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return service;
};
