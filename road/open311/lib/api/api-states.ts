import axios from 'axios';
import {ServiceRequestState} from "../model/service-request-state";

export async function getStates(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
): Promise<ServiceRequestState[]> {
    const resp = await axios.get(endpointUrl + '/states', {
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });
    if (resp.status != 200) {
        throw Error('method=getStates Fetching states failed, status: ' + resp.status);
    }
    return resp.data;
}
