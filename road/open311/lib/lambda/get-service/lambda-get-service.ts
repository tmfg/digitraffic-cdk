import * as ServicesService from "../../service/services";
import {NOT_FOUND_MESSAGE} from '@digitraffic/common/aws/types/errors';
import {Service} from "../../model/service";

// eslint-disable-next-line camelcase
export const handler = async (event: {service_id?: string}) : Promise<Service> => {
    const serviceId = event.service_id as string | null;
    const service = await ServicesService.find(serviceId as string);
    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return service;
};
