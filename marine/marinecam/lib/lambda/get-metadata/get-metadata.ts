import * as MetadataService from '../../service/metadata';
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

export const handler = () => {
    return secretHolder.setDatabaseCredentials()
        .then(() => MetadataService.listAllCameras(['Saimaa']))
        .then(cameras => LambdaResponse.ok(cameras))
        .catch(e => {
            console.error(e);
            return LambdaResponse.internalError();
        });
};
