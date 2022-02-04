import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import * as CountingSitesService from "../../service/counting-sites";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";

const secretId = process.env.SECRET_ID as string;

export const handler = (event: Record<string, string>) => {
    return withDbSecret(secretId, () => {
        const start = Date.now();
        const domainName = event.domainName;

        return CountingSitesService.findCounters(domainName).then(featureCollection => {
            return LambdaResponse.okJson(featureCollection);
        }).catch(error => {
            console.info("error " + error);

            return LambdaResponse.internalError();
        }).finally(() => {
            console.info("method=CountingSites.GetCounters tookMs=%d", (Date.now() - start));
        });
    });
};

