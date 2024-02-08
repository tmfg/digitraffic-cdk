import type { ServiceRequestState } from "../model/service-request-state.js";
import { getXml } from "./xmlapiutils.js";
import type { Locale } from "../model/locale.js";
import type { NonEmptyArray } from "../util-types.d.ts";

export async function getStates(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale
): Promise<ServiceRequestState[]> {
    const parsedStates: StatesResponse = await getXml(
        endpointUser,
        endpointPass,
        endpointUrl,
        `/states?locale=${locale}`
    );
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
    readonly key: NonEmptyArray<number>;
    readonly name: NonEmptyArray<string>;
    readonly locale: NonEmptyArray<string>;
}

function responseToStates(response: StatesResponse): ServiceRequestState[] {
    return response.states.state.map((s) => ({
        key: s.key[0],
        name: s.name[0],
        locale: s.locale[0] as Locale
    }));
}
