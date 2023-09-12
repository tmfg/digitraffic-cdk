import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { validate, ValuesQueryParameters } from "../../model/parameters";
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

    const year = event.year || new Date().getUTCFullYear();
    const month = event.month || new Date().getUTCMonth() + 1;

    const filename = `${year}-${month}.csv`;

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.getValuesForMonth(year, month, event.domain_name, event.counter_id))
        .then((data) => {
            return LambdaResponse.ok(data[0], filename).withTimestamp(data[1]);
        })
        .catch((error: Error) => {
            logException(logger, error);

            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetCSVData",
                tookMs: Date.now() - start
            });
        });
};
