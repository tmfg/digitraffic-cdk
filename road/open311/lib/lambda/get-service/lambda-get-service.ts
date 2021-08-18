import * as ServicesService from "../../service/services";
import {NOT_FOUND_MESSAGE} from 'digitraffic-common/api/errors';

export const handler = async (
    event: any
) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;
    const service = await ServicesService.find(serviceId as string);
    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return service;
};
