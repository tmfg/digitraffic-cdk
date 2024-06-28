import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import {
    type OcpiErrorResponse,
    StatusCode,
    type StatusCodeValue,
    type VersionString,
    type VersionsResponse
} from "../api/ocpi/ocpi-api-responses.js";
import { type OcpiModule, VERSION_2_1_1 } from "../model/ocpi-constants.js";

const SERVICE = "OcpiEmspApiService";

export function getVersionsUrl(domain: string): string {
    const url = `${domain}/ocpi/emsp/versions/`;
    logger.debug({
        method: `${SERVICE}.getVersionsUrl`,
        customUrl: url
    });
    return url;
}

export function getModuleUrl(domain: string, module: OcpiModule, version: VersionString): string {
    const url = `${domain}/ocpi/emsp/${version}/${module}/`;
    logger.debug({
        method: `${SERVICE}.getModuleUrl`,
        customUrl: url
    });
    return url;
}

function getVersionDetailsUrl(domain: string, version: VersionString): string {
    const url = `${domain}/ocpi/emsp/${version}/`;
    logger.debug({
        method: `${SERVICE}.getVersionDetailsUrl`,
        customUrl: url
    });
    return url;
}

/**
 * Returns suppoted versions urls
 * @param domain
 * @returns Supported versions urls
 */
export function getVersionsResponse(domain: string): VersionsResponse {
    return {
        type: "Success",
        status_code: StatusCode.success,
        status_message: "Success",
        timestamp: new Date(),
        data: [
            { version: VERSION_2_1_1, url: getVersionDetailsUrl(domain, VERSION_2_1_1) }
            // { version: VERSION_2_2_1, url: getVersionDetailsUrl(domain, VERSION_2_2_1) }
        ]
    };
}

export function getErrorResponse(statusCode: StatusCodeValue): OcpiErrorResponse {
    return {
        type: "Error",
        status_code: statusCode,
        status_message: "Failed",
        timestamp: new Date()
    };
}
