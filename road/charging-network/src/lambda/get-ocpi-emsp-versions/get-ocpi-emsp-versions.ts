import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../../keys.js";
import { parseAuthEvent } from "../../service/lambda-authorizer-service.js";
import * as OcpiEmspApiService from "../../service/ocpi-emsp-api-service.js";

const domain = getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL);

const method = `GetOcpiEmspVersions.handler` as const;

// /ocpi/emsp/versions -> versions endpoint
export const handler = (event: Record<string, string>): LambdaResponse => {
    const start = Date.now();

    const dtCpoId: string = parseAuthEvent(event);
    logger.info({
        method,
        customDtCpoId: dtCpoId
    });

    try {
        const versions = OcpiEmspApiService.getVersionsResponse(domain);
        logger.debug({
            method,
            customDtCpoId: dtCpoId,
            message: `versionsResponse: ${JSON.stringify(versions)}`
        });
        return LambdaResponse.okJson(versions);
    } catch (error) {
        logger.error({
            method,
            customDtCpoId: dtCpoId,
            message: `Error while getting supported versions`,
            error
        });
        return LambdaResponse.internalError();
    } finally {
        logger.info({
            method,
            customDtCpoId: dtCpoId,
            tookMs: Date.now() - start
        });
    }
};
