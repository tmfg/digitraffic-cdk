import {findAll} from "../../service/states";
import {ServiceRequestState} from "../../model/service-request-state";

export const handler = async (): Promise<ServiceRequestState[]> => {
    return await findAll();
};
