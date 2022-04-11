import * as MetadataService from '../../service/metadata';
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    return proxyHolder.setCredentials()
        .then(() => MetadataService.listAllCameras(['Saimaa']))
        .then(cameras => LambdaResponse.ok(cameras))
        .catch(e => {
            console.error(e);
            return LambdaResponse.internalError();
        });
};
