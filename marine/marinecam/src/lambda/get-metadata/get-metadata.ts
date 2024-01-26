import * as MetadataService from "../../service/metadata.js";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { Camera } from "../../model/camera.js";

const rdsHolder = RdsHolder.create();

export const handler: () => Promise<LambdaResponse> = () => {
    return rdsHolder
        .setCredentials()
        .then(() => MetadataService.listAllCameras(["Saimaa"]))
        .then((cameras: Camera[]) => LambdaResponse.okJson(cameras))
        .catch((e: unknown) => {
            logException(logger, e as Error);
            return LambdaResponse.internalError();
        });
};
