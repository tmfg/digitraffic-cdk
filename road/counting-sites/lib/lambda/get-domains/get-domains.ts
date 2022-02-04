import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";

const secretId = process.env.SECRET_ID as string;

export const handler = () => {
    return withDbSecret(secretId, () => {
        const start = Date.now();

        return CountingSitesService.getDomains().finally(() => {
            console.info("method=CountingSites.GetDomains tookMs=%d", (Date.now() - start));
        });
    });
};

