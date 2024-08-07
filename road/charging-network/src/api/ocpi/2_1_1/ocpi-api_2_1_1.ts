import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as OcpiApiService from "../../../service/ocpi-emsp-api-service.js";
import * as OcpiApi from "../ocpi-api.js";
import type { Credentials, CredentialsObject, LocationResponse } from "./ocpi-api-responses_2_1_1.js";

const SERVICE = "OcpiV2_1_1Api";

export const TOTAL_COUNT_HEADER = "x-total-count" as const;
export const LIMIT_HEADER = "x-limit" as const;

export async function postCredentials(
    credentialsEndpoint: string,
    tokenA: string,
    tokenB: string,
    domain: string,
    partyId: string,
    businessDetailsName: string,
    businessDetailsWebsite: string
): Promise<CredentialsObject> {
    const method = `${SERVICE}.postCredentials`;
    const credentials = {
        url: OcpiApiService.getVersionsUrl(domain),
        token: tokenB,
        party_id: partyId, // Digitraffic Test
        country_code: "FI",
        business_details: {
            name: businessDetailsName,
            website: businessDetailsWebsite
        }
    } satisfies Credentials;

    logger.debug({
        method,
        message: "Sending credentials and tokenB",
        credentialsUrl: credentials.url,
        partyId: partyId
    });

    return await OcpiApi.postToServer<CredentialsObject, Credentials>(
        credentialsEndpoint,
        tokenA,
        credentials
    );
}

/**
 *
 * @param locationsEndpoint
 * @param tokenC
 * @param offset
 * @param limit
 * @returns array with values [ response: LocationResponse, LIMIT_HEADER: number, TOTAL_COUNT_HEADER: number ]
 */
export async function getLocations(
    locationsEndpoint: string,
    tokenC: string,
    offset: number,
    limit: number
): Promise<GetLocationsResponse> {
    const method = `${SERVICE}.getLocations`;
    const url = `${locationsEndpoint}?offset=${offset}&limit=${limit}`;
    logger.info({
        method,
        customUrl: url
    });

    return OcpiApi.getFromServer<LocationResponse>(url, tokenC, [LIMIT_HEADER, TOTAL_COUNT_HEADER]).then(
        (response: OcpiApi.ResponseWithHeader<LocationResponse>) => {
            return {
                response: response.data,
                limit: Number(response.headers[LIMIT_HEADER]) || undefined,
                totalCount: Number(response.headers[TOTAL_COUNT_HEADER]) || undefined
            } as GetLocationsResponse;
        }
    );
}

export interface GetLocationsResponse {
    response: LocationResponse;
    limit?: number;
    totalCount?: number;
}
