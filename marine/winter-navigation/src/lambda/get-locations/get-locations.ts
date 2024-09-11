import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getLocations } from "../../service/location-service.js";

const proxyHolder = ProxyHolder.create();

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        return proxyHolder
            .setCredentials()
            .then(() => getLocations())
            .then(([locations, lastUpdated]) => {
                return lastUpdated
                    ? LambdaResponse.okJson(locations).withTimestamp(lastUpdated)
                    : LambdaResponse.okJson(locations);
            });
    } catch (error) {

        logException(logger, error, true);

        return LambdaResponse.internalError();
    } finally {
        logger.info({
            method: "GetFaults.handler",
            tookMs: Date.now() - start
        });
    }
};