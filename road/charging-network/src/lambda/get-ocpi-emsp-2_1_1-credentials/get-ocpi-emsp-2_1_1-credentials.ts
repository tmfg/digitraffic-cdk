import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { StatusCode } from "../../api/ocpi/ocpi-api-responses";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../../keys";
import * as ocpiApiServiceV2_1_1 from "../../service/ocpi-emsp-api-service_2_1_1";
import { parseAuthEvent as parseAuthContextDtCpoId } from "../../service/lambda-authorizer-service";
import { getErrorResponse } from "../../service/ocpi-emsp-api-service";

const proxyHolder = ProxyHolder.create();

const domain = getEnvVariable(ChargingNetworkKeys.OCPI_DOMAIN_URL);

const method = `GetOcpiEmsp_2_1_1_Credentials.handler` as const;

// /ocpi/emsp/2.1.1/credentials
export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    logger.debug({
        method,
        event
    });

    const postRequest = event.httpMethod === "POST";

    let dtCpoId: string | undefined = undefined;
    try {
        dtCpoId = parseAuthContextDtCpoId(event);
        logger.debug({
            method,
            customDtCpoId: dtCpoId
        });
    } catch (e) {
        return LambdaResponse.badRequest(
            JSON.stringify(getErrorResponse(StatusCode.errorClientMissingParameters))
        );
    }

    const dtCpoIdSet: string = dtCpoId; // Why do I need this?
    try {
        const credentials = await proxyHolder
            .setCredentials()
            .then(() => ocpiApiServiceV2_1_1.getCredentialsResponse(domain, dtCpoIdSet));
        logger.debug({
            method,
            customDtCpoId: dtCpoId,
            message: `getCredentialsResponse: ${JSON.stringify(credentials)}`
        });
        /* Just for testing to register with self */
        if (postRequest) {
            return LambdaResponse.internalError();
            /*
            const tokenC = generateToken();
            if (credentials.data.token) {
                credentials.data.token = tokenC;
            }
            logger.debug({
                method,
                customDtCpoId: dtCpoId,
                message: `POST -> generate token: ${JSON.stringify(credentials.data.token)}`
            });
            */
        }

        return LambdaResponse.okJson(credentials);
    } catch (error) {
        logger.error({
            method,
            customDtCpoId: dtCpoId,
            message: `Error while getCredentialsResponse`,
            error,
            stack: error instanceof Error ? error.stack : undefined
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
