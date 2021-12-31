import {ServiceRequestState} from '../model/service-request-state';
import {getXml} from './xmlapiutils';
import {Locale} from '../model/locale';

export async function getStates(endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale): Promise<ServiceRequestState[]> {
    const parsedStates: StatesResponse = await getXml(endpointUser,
        endpointPass,
        endpointUrl,
        `/states?locale=${locale}`);
    return responseToStates(parsedStates);
}

interface StatesResponse {
    readonly states: StateResponseWrapper;
}

interface StateResponseWrapper {
    readonly state: StateResponse[];
}

// properties deserialized as singleton arrays
interface StateResponse {
    readonly key: number[];
    readonly name: string[];
    readonly locale: string[];
}

function responseToStates(response: StatesResponse): ServiceRequestState[] {
    return response.states.state.map(s => ({
        key: s.key[0],
        name: s.name[0],
        locale: s.locale[0] as Locale,
    }));
}
