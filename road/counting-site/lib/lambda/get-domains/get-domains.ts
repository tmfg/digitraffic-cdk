import * as CountingSitesService from "../../service/counting-sites";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";

const proxyHolder = ProxyHolder.create();

export const handler = async () => {
    const start = Date.now();

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.getDomains())
        .then((domains) => LambdaResponse.okJson(domains))
        .finally(() => {
            console.info(
                "method=CountingSites.GetDomains tookMs=%d",
                Date.now() - start
            );
        });
};
