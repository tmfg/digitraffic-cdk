import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SECRET_ID} from "digitraffic-common/aws/types/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = (event: Record<string, string>) => {
    return withDbSecret(secretId, () => {
        const start = Date.now();
        const domain = event.domain;

        return CountingSitesService.getCountersForDomain(domain).then(featureCollection => {
            if (featureCollection.features) {
                return LambdaResponse.ok(JSON.stringify(featureCollection, null, 3));
            } else {
                return LambdaResponse.notFound();
            }
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCounters tookMs=%d", (Date.now() - start));
        });
    });
};

