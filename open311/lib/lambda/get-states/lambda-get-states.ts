import {findAll} from "../../service/states";
import {IDatabase} from "pg-promise";
import {ServiceRequestState} from "../../model/service-request-state";

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<ServiceRequestState[]> => {
    return await findAll(dbParam);
};
