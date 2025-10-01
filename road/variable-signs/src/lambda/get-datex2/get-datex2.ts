import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { findSituationsDatex2_223 } from "../../service/variable-signs.js";

const proxyHolder = ProxyHolder.create();

export const handler = (): Promise<LambdaResponse> => {
  const start = Date.now();

  return proxyHolder
    .setCredentials()
    .then(() => findSituationsDatex2_223())
    .then(([datex, lastModified]) =>
      LambdaResponse.ok(datex).withTimestamp(lastModified)
    )
    .finally(() => {
      logger.info({
        method: "GetDatex2.handler",
        tookMs: Date.now() - start,
      });
    });
};
