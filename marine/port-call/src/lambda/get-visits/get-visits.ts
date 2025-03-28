import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { z, ZodError } from "zod";
import { findAllVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();

const EmptyStringUndefined = z.literal("").transform(() => undefined);
const OptionalDateString = z.coerce.date().optional().or(EmptyStringUndefined);

const getVisitsSchema = 
    z.object({
        from: OptionalDateString,
        to: OptionalDateString
    })
    .strict()
    .readonly();

export type GetVisitsParameters = z.infer<typeof getVisitsSchema>;

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        const getVisitsEvent = getVisitsSchema.parse(event);

        return proxyHolder
            .setCredentials()
            .then(() => findAllVisits(getVisitsEvent))
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
