import * as PermitsService from "../../service/permits.js";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const holder = ProxyHolder.create();

export const handler = async () => {
    await holder.setCredentials();

    const start = Date.now();

    return PermitsService.findPermitsInD2Light()
        .then((result) => {
            return LambdaResponse.okJson(result);
        })
        .catch((error) => {
            logger.error({
                method: "get-permits-datex2.handler",
                error: error
            });

            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "get-permits-datex2.handler",
                tookMs: Date.now() - start
            });
        });
};
