import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = async (event: any): Promise<any> => {
    return await withDbSecret(secretId, async (): Promise<any> => {
        const start = Date.now();
        const counterId = event.id;

        try {
            const data = await CountingSitesService.getDataForCounter(counterId);

            console.info(counterId + " data " + JSON.stringify(data, null, 3));

            return data;
        } finally {
            console.info("method=CountingSites.GetData tookMs=%d", (Date.now() - start))
        }
    });
};

