import * as CountingSitesService from "../../service/counting-sites";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.getUserTypes())
        .then((types) => LambdaResponse.okJson(types))
        .finally(() => {
            console.info("method=CountingSites.GetUserTypes tookMs=%d", Date.now() - start);
        });
};
