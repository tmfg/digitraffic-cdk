import * as MetadataService from '../../service/metadata';

import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/aws/types/lambda-environment";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    try {
        const cameras = await withDbSecret(secretId, () => {
            return MetadataService.listAllCameras(['Saimaa']);
        });

        return LambdaResponse.ok(cameras);
    } catch (e) {
        console.error(e);
        return LambdaResponse.internalError();
    }
};