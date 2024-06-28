import type { ValueOf } from "@digitraffic/common/dist/types/util-types";

export type VersionString = `${number}.${number}.${number}` | `${number}.${number}`;

/** (255) An URL a string(255) type following the https://www.w3.org/Addressing/URL/uri-spec.html spec. */
export type URL = string;

export const StatusCode = {
    /** // 1xxx: Success */
    success: 1000, //
    /** Generic client error */
    errorClient: 2000,
    /** Invalid or missing parameters */
    errorClientMissingParameters: 2001,
    /** Not enough information, for example: Authorization request with too little information. */
    errorClientNotEnoughInformation: 2002,
    /** Unknown Location, for example: Command: STARTSESSION with unknown location. */
    errorClientUnknownLocation: 2003,
    /** Generic server error */
    errorServer: 3000,
    /** Unable to use the client’s API. For example during the credentials registration: When the initializing party requests data from the other party during the open POST call to its credentials endpoint. If one of the GETs can not be processed, the party should return this error in the POST response. */
    errorServerClientApi: 3001,
    /** Unsupported version. */
    errorServerUnsupportedVersion: 3002,
    /** No matching endpoints or expected endpoints missing between parties. Used during the registration process if the two parties do not have any mutual modules or endpoints available, or the minimum expected by the other party implementation. */
    errorServerEndpointsMissing: 3003
} as const;

export type StatusCode = keyof typeof StatusCode;
export type StatusCodeValue = ValueOf<typeof StatusCode>;

export interface Version {
    version: VersionString;
    url: URL;
}

export interface VersionEndpoints {
    version: string;
    endpoints: Endpoint[];
}

export interface Endpoint {
    identifier: string;
    url: URL;
}

export type OcpiResponse<T> = OcpiSuccessResponse<T> | OcpiErrorResponse;

export interface OcpiSuccessResponse<T> {
    type: "Success";
    data: T;
    status_code: StatusCodeValue;
    status_message: "Success";
    timestamp: Date;
}

export interface OcpiErrorResponse {
    type: "Error";
    status_code: StatusCodeValue;
    status_message: "Failed";
    timestamp: Date;
}

export interface VersionsResponse extends OcpiSuccessResponse<Version[]> {}

export interface VersionDetailsResponse extends OcpiSuccessResponse<VersionEndpoints> {}
