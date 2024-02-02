import type { Service, ServiceType } from "../model/service.js";
import { getXml } from "./xmlapiutils.js";
import type { NonEmptyArray } from "../util-types.d.ts";

export async function getServices(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
): Promise<Service[]> {
    const parsedServices: ServicesResponse = await getXml(
        endpointUser,
        endpointPass,
        endpointUrl,
        "/services.xml"
    );
    const services = responseToServices(parsedServices);

    // integration can return services with all fields as null, ensure conformity with db constraints
    return services.filter((s) => s.service_code !== null && s.service_name !== null);
}

interface ServicesResponse {
    readonly services: ServiceResponseWrapper;
}

interface ServiceResponseWrapper {
    readonly service: ServiceResponse[];
}

// properties deserialized as singleton arrays
interface ServiceResponse {
    readonly service_code: NonEmptyArray<string>;
    readonly service_name: NonEmptyArray<string>;
    readonly description: NonEmptyArray<string>;
    readonly metadata: NonEmptyArray<string>;
    readonly type: NonEmptyArray<string>;
    readonly keywords: NonEmptyArray<string>;
    readonly group: NonEmptyArray<string>;
}

function responseToServices(response: ServicesResponse): Service[] {
    return response.services.service.map((s) => ({
        service_code: s.service_code[0],
        service_name: s.service_name[0],
        description: s.description[0],
        metadata: s.metadata[0] === "true",
        type: s.type[0] as ServiceType,
        keywords: s.keywords[0],
        group: s.group[0]
    }));
}
