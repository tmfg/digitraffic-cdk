import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { z, ZodError } from "zod";
import { findAllVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();

const getVisitsSchema = z.object({
    // not yet
}).strict();

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        const getVisitsEvent = getVisitsSchema.parse(event);

        return proxyHolder
            .setCredentials()
            .then(() => findAllVisits())
            .then(([visits, lastUpdated]) => {
                return lastUpdated
                    ? LambdaResponse.okJson(visits).withTimestamp(lastUpdated)
                    : LambdaResponse.okJson(visits);
            });
    } catch (error) {
        if (error instanceof ZodError) {
            return LambdaResponse.badRequest(JSON.stringify(error.issues));
        }

        logException(logger, error, true);

        return LambdaResponse.internalError();
    } finally {
        logger.info({
            method: "GetVisits.handler",
            tookMs: Date.now() - start
        });
    }
};
