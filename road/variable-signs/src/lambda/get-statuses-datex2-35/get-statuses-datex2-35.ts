import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { findStatusesDatex2_35 } from "../../service/variable-signs.js";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
  const start = Date.now();

  return proxyHolder
    .setCredentials()
    .then(() => findStatusesDatex2_35())
    .then(([datex, lastModified]) =>
      LambdaResponse.ok(datex).withTimestamp(lastModified),
    )
    .finally(() => {
      logger.info({
        method: "GetStatusesDatex2-35.handler",
        tookMs: Date.now() - start,
      });
    });
};
