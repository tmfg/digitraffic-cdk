import * as PermitsService from "../../service/permits";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

const holder = ProxyHolder.create();

export const handler = async () => {
    await holder.setCredentials();

    const start = Date.now();

    return PermitsService.findPermitsInD2Light()
        .then((result) => {
            return LambdaResponse.okJson(result);
        })
        .catch((error) => {
            console.error(
                "method=StreetTrafficMessage.GetPermitsInD2Light " + error
            );

            return LambdaResponse.internalError();
        })
        .finally(() => {
            console.info(
                "method=StreetTrafficMessage.GetPermitsInD2Light tookMs=%d",
                Date.now() - start
            );
        });
};
