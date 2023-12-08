import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../../keys";
import { parseAuthEvent } from "../../service/lambda-authorizer-service";
import * as OcpiEmspApiService_2_1_1 from "../../service/ocpi-emsp-api-service_2_1_1";

const domain = getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL);

const method = `GetOcpiEmsp_2_1_1.handler` as const;

// /ocpi/emsp/2.1.1 -> Version details endpoint
export const handler = (event: Record<string, string>): LambdaResponse => {
    const start = Date.now();

    let dtCpoId: string | undefined = undefined;

    try {
        dtCpoId = parseAuthEvent(event);
        logger.info({
            method,
            customDtCpoId: dtCpoId
        });

        const version = OcpiEmspApiService_2_1_1.getVersionDetailsResponse(domain);
        logger.info({
            method,
            customDtCpoId: dtCpoId,
            message: `versionResponse: ${JSON.stringify(version)}`
        });
        return LambdaResponse.okJson(version);
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
