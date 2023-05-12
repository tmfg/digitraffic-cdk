import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();
    const counterId = event.counterId;

    if (Number.isNaN(Number(counterId))) {
        return Promise.resolve(LambdaResponse.notFound());
    }

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.findCounters("", counterId))
        .then((featureCollection) => {
            if (featureCollection.features.length === 0) {
                return LambdaResponse.notFound();
            }
            return LambdaResponse.okJson(featureCollection);
        })
        .catch((error: Error) => {
            console.info("error " + error.toString());

            return LambdaResponse.internalError();
        })
        .finally(() => {
            console.info("method=CountingSites.GetCounter tookMs=%d", Date.now() - start);
        });
};
