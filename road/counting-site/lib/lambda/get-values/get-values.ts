import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validate, ValuesQueryParameters } from "../../model/parameters";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

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
            console.info("error " + error.toString());
            logger.error({
                method: "CountingSites.GetData",
                message: "Failed to get values",
                error: error
            });
            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetData",
                tookMs: Date.now() - start
            });
        });
};
