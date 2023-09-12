import * as CountingSitesService from "../../service/counting-sites";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const proxyHolder = ProxyHolder.create();

// TODO: API v2: return only Feature not featureCollection
export const handler = (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();
    const counterId = event.counterId;

    if (Number.isNaN(Number(counterId))) {
        return Promise.resolve(LambdaResponse.notFound().withTimestamp(EPOCH));
    }

    return proxyHolder
        .setCredentials()
        .then(() => CountingSitesService.findCounters("", counterId))
        .then(([featureCollection, lastModified]) => {
            if (featureCollection.features.length === 0) {
                return LambdaResponse.notFound().withTimestamp(EPOCH);
            }
            return LambdaResponse.okJson(featureCollection).withTimestamp(lastModified);
        })
        .catch((error: Error) => {
            logException(logger, error);

            return LambdaResponse.internalError();
        })
        .finally(() => {
            logger.info({
                method: "CountingSites.GetCounter",
                tookMs: Date.now() - start
            });
        });
};
