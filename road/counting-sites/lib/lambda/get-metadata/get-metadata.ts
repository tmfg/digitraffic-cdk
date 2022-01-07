import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = () => {
    return withDbSecret(secretId, () => {
        const start = Date.now();

        return CountingSitesService.getMetadata().finally(() => {
            console.info("method=CountingSites.GetMetadata tookMs=%d", (Date.now() - start));
        });
    });
};

