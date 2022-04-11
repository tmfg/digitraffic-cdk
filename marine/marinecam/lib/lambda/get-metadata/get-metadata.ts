import * as MetadataService from '../../service/metadata';
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {RdsHolder} from "digitraffic-common/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

export const handler = () => {
    return rdsHolder.setCredentials()
        .then(() => MetadataService.listAllCameras(['Saimaa']))
        .then(cameras => LambdaResponse.ok(cameras))
        .catch(e => {
            console.error(e);
            return LambdaResponse.internalError();
        });
};
