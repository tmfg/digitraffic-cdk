import axios from 'axios';
import {ServiceRequestState} from "../model/service-request-state";

export async function getStates(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
): Promise<ServiceRequestState[]> {
    const resp = await axios.get(endpointUrl, {
        headers: {
            'Accept': 'application/xml'
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });
    if (resp.status != 200) {
        throw Error('Fetching services failed: ' + resp.statusText);
    }
    return resp.data;
}
