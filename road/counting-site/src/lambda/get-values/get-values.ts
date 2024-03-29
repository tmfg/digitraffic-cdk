import * as CountingSitesService from "../../service/counting-sites.js";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validate, type ValuesQueryParameters } from "../../model/parameters.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const proxyHolder = ProxyHolder.create();

export const handler = (event: ValuesQueryParameters): Promise<LambdaResponse> => {
    const start = Date.now();

    const validationError = validate(event);
    if (validationError) {
        return Promise.resolve(LambdaResponse.badRequest(validationError));
    }

    return proxyHolder
        .setCredentials()
        .then(() =>
            CountingSitesService.findCounterValues(
                event.year,
                event.month,
                event.counter_id,
                event.domain_name
            )
        )
        .then(([data, lastModified]) => {
            return LambdaResponse.okJson(data).withTimestamp(lastModified);
        })
        .catch((error: Error) => {
            logException(logger, error);

            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetData",
                tookMs: Date.now() - start
            });
        });
};
