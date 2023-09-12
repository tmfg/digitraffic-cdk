import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();
    const domainName = event.domainName;

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.findCounters(domainName))
        .then(([featureCollection, lastModified]) => {
            return LambdaResponse.okJson(featureCollection).withTimestamp(lastModified);
        })
        .catch((error: Error) => {
            logException(logger, error);

            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetCounters",
                tookMs: Date.now() - start
            });
        });
};
