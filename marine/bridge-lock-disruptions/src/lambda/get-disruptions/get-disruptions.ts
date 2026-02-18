import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { findAllDisruptions } from "../../service/disruptions.js";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
  return proxyHolder
    .setCredentials()
    .then(() => findAllDisruptions())
    .then(([disruptions, lastModified]) =>
      LambdaResponse.ok(JSON.stringify(disruptions)).withTimestamp(
        lastModified,
      ),
    )
    .catch((error: Error) => {
      logException(logger, error, true);

      return LambdaResponse.internalError();
    });
};
