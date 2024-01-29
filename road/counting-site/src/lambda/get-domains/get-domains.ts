import * as CountingSitesService from "../../service/counting-sites.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = async (): Promise<LambdaResponse> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.getDomains())
        .then(([domains, lastModified]) => {
            return LambdaResponse.okJson(domains).withTimestamp(lastModified);
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetDomains",
                tookMs: Date.now() - start
            });
        });
};
