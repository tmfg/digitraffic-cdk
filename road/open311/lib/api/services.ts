import { Service, ServiceType } from "../model/service";
import { getXml } from "./xmlapiutils";

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
    readonly service_code: string[];
    readonly service_name: string[];
    readonly description: string[];
    readonly metadata: string[];
    readonly type: string[];
    readonly keywords: string[];
    readonly group: string[];
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
