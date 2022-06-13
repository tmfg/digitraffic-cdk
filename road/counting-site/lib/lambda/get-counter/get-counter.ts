import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>) => {
    const start = Date.now();
    const counterId = event.counterId;

    if (Number.isNaN(Number(counterId))) {
        return Promise.resolve(LambdaResponse.notFound());
    }

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.findCounters("", counterId))
        .then(featureCollection => {
            if (featureCollection?.features.length === 0) {
                return LambdaResponse.notFound();
            }
            return LambdaResponse.okJson(featureCollection);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCounter tookMs=%d", (Date.now() - start));
        });
};

