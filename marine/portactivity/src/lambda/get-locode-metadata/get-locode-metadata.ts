import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import * as MetadataService from "../../service/metadata.js";

const rdsHolder = RdsHolder.create();

export const handler = (): Promise<LambdaResponse> => {
  return rdsHolder
    .setCredentials()
    .then(async () => {
      const locodes = await MetadataService.getLocodesWithPredictions();
      return LambdaResponse.okJson(locodes);
    })
    .catch((error) => {
      logException(logger, error);
      return LambdaResponse.internalError();
    });
};
