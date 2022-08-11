import {findAllDisruptions} from "../../service/disruptions";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = () : Promise<LambdaResponse<string>> => {
    return proxyHolder.setCredentials()
        .then(() => findAllDisruptions())
        .then(disruptions => LambdaResponse.ok(JSON.stringify(disruptions)))
        .catch((error: Error) => {
            console.error('method=getDisruptionsHandler error', error);
            return LambdaResponse.internalError();
        });
};
