import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async (event: Record<string, number>) => {
    return withDbSecret(secretId, async () => {
        const start = Date.now();
        const counterId = event.id;

        try {
            const data = await CountingSitesService.getDataForCounter(counterId);

            if (data.length === 0) {
                return LambdaResponse.notFound();
            }
            return LambdaResponse.ok(data);
        } catch (e) {
            console.info("error " + e);

            return LambdaResponse.internalError();
        } finally {
            console.info("method=CountingSites.GetData tookMs=%d", (Date.now() - start));
        }
    });
};

