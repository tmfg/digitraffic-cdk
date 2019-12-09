import axios from 'axios';
import * as util from "util";
import * as xml2js from "xml2js";
import {Service, ServiceType} from "../model/service";

export async function getServices(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string
) {
    const resp = await axios.get(endpointUrl, {
        headers: {
            'Accept': 'application/xml'
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });
    const parse = util.promisify(xml2js.parseString);
    const parsedServices = <ServicesResponse> await parse(resp.data);
    const services = responseToServices(parsedServices);
    if (resp.status != 200) {
        throw Error('Fetching services failed: ' + resp.statusText);
    }
    return services;
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
    return response.services.service.map(s => ({
        service_code: s.service_code[0],
        service_name: s.service_name[0],
        description: s.description[0],
        metadata: s.metadata[0] == 'true',
        type: ServiceType[s.type[0] as ServiceType],
        keywords: s.keywords[0],
        group: s.group[0]
    }));
}
