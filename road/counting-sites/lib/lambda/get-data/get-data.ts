import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (event: any): Promise<LambdaResponse> => {
    return withDbSecret(secretId, async (): Promise<LambdaResponse> => {
        const start = Date.now();
        const counterId = event.id;

        try {
            const data = await CountingSitesService.getDataForCounter(counterId);

            if(data.length === 0) {
                return LambdaResponse.not_found();
            }
            return LambdaResponse.ok(data);
        } catch(e) {
            console.info("error " + e);

            return LambdaResponse.internal_error();
        } finally {
            console.info("method=CountingSites.GetData tookMs=%d", (Date.now() - start))
        }
    });
};

