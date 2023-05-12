import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();
    const domainName = event.domainName;

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.findCounters(domainName))
        .then((featureCollection) => {
            return LambdaResponse.okJson(featureCollection);
        })
        .catch((error: Error) => {
            console.info("error " + error.toString());

            return LambdaResponse.internalError();
        })
        .finally(() => {
            console.info("method=CountingSites.GetCounters tookMs=%d", Date.now() - start);
        });
};
