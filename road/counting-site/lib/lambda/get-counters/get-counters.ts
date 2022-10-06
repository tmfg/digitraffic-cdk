import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "@digitraffic/common/aws/types/lambda-response";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>) => {
    const start = Date.now();
    const domainName = event.domainName;

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.findCounters(domainName)).then(featureCollection => {
            return LambdaResponse.okJson(featureCollection);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCounters tookMs=%d", (Date.now() - start));
        });
};

