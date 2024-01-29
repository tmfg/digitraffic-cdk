import * as VariableSignsService from "../../service/variable-signs.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => VariableSignsService.findActiveSignsDatex2())
        .then(([datex, lastModified]) => LambdaResponse.ok(datex).withTimestamp(lastModified))
        .finally(() => {
            logger.info({
                method: "GetDatex2.handler",
                tookMs: Date.now() - start
            });
        });
};
