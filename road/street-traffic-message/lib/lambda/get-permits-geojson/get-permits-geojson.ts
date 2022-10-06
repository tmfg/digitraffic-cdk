import * as PermitsService from "../../service/permits";
import {LambdaResponse} from "@digitraffic/common/aws/types/lambda-response";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    return PermitsService.findPermitsInGeojson().then(result => {
        return LambdaResponse.okJson(result);
    }).catch(error => {
        console.error("method=StreetTrafficMessage.GetPermitsGeoJson error " + error);

        return LambdaResponse.internalError();
    }).finally(() => {
        console.info("method=StreetTrafficMessage.GetPermitsGeoJson tookMs=%d", (Date.now() - start));
    });
};

