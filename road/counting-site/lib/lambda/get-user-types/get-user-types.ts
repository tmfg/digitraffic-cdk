import * as CountingSitesService from "../../service/counting-sites";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.getUserTypes())
        .then(([types, lastModified]) => LambdaResponse.okJson(types).withTimestamp(lastModified))
        .finally(() => {
            logger.info({
                method: "CountingSites.GetUserTypes",
                tookMs: Date.now() - start
            });
        });
};
