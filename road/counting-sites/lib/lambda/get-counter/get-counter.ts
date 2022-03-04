import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async (event: Record<string, string>) => {
    await holder.setDatabaseCredentials();

    const start = Date.now();
    const counterId = event.counterId;

    return CountingSitesService.findCounters("", counterId).then(featureCollection => {
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

