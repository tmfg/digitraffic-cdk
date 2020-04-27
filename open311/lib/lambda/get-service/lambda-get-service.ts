import {find} from "../../service/services";
import {NOT_FOUND_MESSAGE} from 'digitraffic-cdk-api/errors';
import {IDatabase} from "pg-promise";

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
) : Promise <any> => {
    const serviceId = event['service_id'] as string | null;
    const service = await find(serviceId as string, dbParam);
    if (!service) {
        throw new Error(NOT_FOUND_MESSAGE);
    }
    return service;
};
