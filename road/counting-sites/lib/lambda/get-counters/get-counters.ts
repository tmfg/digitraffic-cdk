import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (event: any): Promise<any> => {
    return await withDbSecret(secretId, async (): Promise<any> => {
        const start = Date.now();
        const domain = event.domain;

        try {
            const featureCollection = await CountingSitesService.getCountersForDomain(domain);

            if(featureCollection.features) {
                return LambdaResponse.ok(JSON.stringify(featureCollection, null, 3));
            } else {
                return LambdaResponse.not_found();
            }
        } catch(e) {
            return LambdaResponse.internal_error();
        } finally {
            console.info("method=CountingSites.GetCounters tookMs=%d", (Date.now() - start))
        }
    });
};

