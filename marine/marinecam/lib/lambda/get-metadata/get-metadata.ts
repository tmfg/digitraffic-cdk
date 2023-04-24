import * as MetadataService from "../../service/metadata";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { Camera } from "../../model/camera";

const rdsHolder = RdsHolder.create();

export const handler = () => {
    return rdsHolder
        .setCredentials()
        .then(() => MetadataService.listAllCameras(["Saimaa"]))
        .then((cameras: Camera[]) => LambdaResponse.okJson(cameras))
        .catch((e: unknown) => {
            logException(logger, e as Error);
            return LambdaResponse.internalError();
        });
};
