import * as VariableSignsService from "../../service/variable-signs";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => VariableSignsService.findActiveSignsDatex2())
        .then((datex) => LambdaResponse.ok(datex))
        .finally(() => {
            console.info(
                "method=findActiveSignsDatex2 tookMs=%d",
                Date.now() - start
            );
        });
};
