import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { BusinessDetails, CredentialsObject } from "../api/ocpi/2_1_1/ocpi-api-responses_2_1_1.js";
import { StatusCode, type VersionDetailsResponse } from "../api/ocpi/ocpi-api-responses.js";
import * as OcpiDao from "../dao/ocpi-dao.js";
import { ChargingNetworkKeys } from "../keys.js";
import { OCPI_MODULE_CREDENTIALS, VERSION_2_1_1 } from "../model/ocpi-constants.js";
import { getModuleUrl, getVersionsUrl } from "./ocpi-emsp-api-service.js";

const PARTY_ID = getEnvVariable(ChargingNetworkKeys.OCPI_PARTY_ID);
const BUSINESS_DETAILS_NAME = getEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_NAME);
const WEBSITE = getEnvVariable(ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_WEBSITE);

const SERVICE = "OcpiEmspApiService_2_1_1" as const;

export function getVersionDetailsResponse(domain: string): VersionDetailsResponse {
    return {
        type: "Success",
        status_code: StatusCode.success,
        status_message: "Success",
        timestamp: new Date(),
        data: {
            version: VERSION_2_1_1,
            endpoints: [
                {
                    identifier: "credentials",
                    url: getModuleUrl(domain, OCPI_MODULE_CREDENTIALS, VERSION_2_1_1)
                }
            ]
        }
    };
}

export async function getCredentialsResponse(domainUrl: string, dtCpoId: string): Promise<CredentialsObject> {
    try {
        const tokenB: string = await inDatabaseReadonly(async (db): Promise<string> => {
            // Get token b for cpo
            return OcpiDao.findCpo(db, dtCpoId)
                .then((cpo) => cpo?.token_b)
                .then((tokenB) => {
                    if (tokenB) {
                        return tokenB;
                    }
                    logger.error({
                        method: `${SERVICE}.getCredentialsResponse`,
                        message: "No token b found for cpo",
                        customDtCpoId: dtCpoId
                    });
                    throw new Error(`No token b found for ${dtCpoId}`);
                });
        });
        return {
            type: "Success",
            status_code: StatusCode.success,
            status_message: "Success",
            timestamp: new Date(),
            data: {
                business_details: getBusinessDetails(),
                country_code: "FI",
                party_id: PARTY_ID,
                token: tokenB,
                url: getVersionsUrl(domainUrl)
            }
        };
    } catch (e) {
        logger.error({
            method: `${SERVICE}.getCredentialsResponse`,
            message: "Error ",
            customDtCpoId: dtCpoId,
            error: e,
            stack: e instanceof Error ? e.stack : undefined
        });
        throw e;
    }
}

function getBusinessDetails(): BusinessDetails {
    return {
        name: BUSINESS_DETAILS_NAME,
        website: WEBSITE
        // TODO: logo?
    };
}
