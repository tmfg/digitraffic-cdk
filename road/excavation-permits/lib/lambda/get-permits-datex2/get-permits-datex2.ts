import * as PermitsService from "../../service/permits";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    return PermitsService.findPermitsInD2Light().then(result => {
        return LambdaResponse.okJson(result);
    }).catch(error => {
        console.info("error " + error);

        return LambdaResponse.internalError();
    }).finally(() => {
        console.info("method=ExcavationPermits.GetPermitsInD2Light tookMs=%d", (Date.now() - start));
    });
};

