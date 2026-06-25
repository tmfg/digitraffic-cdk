import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponseBuilder } from "@digitraffic/common/dist/aws/types/lambda-response";
import { findStatusesDatex2_37 } from "../../service/variable-signs.js";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
  const start = Date.now();

  return proxyHolder
    .setCredentials()
    .then(() => findStatusesDatex2_37())
    .then(([datex, lastModified]) =>
      LambdaResponseBuilder.create(datex).withTimestamp(lastModified).build(),
    )
    .finally(() => {
      logger.info({
        method: "GetStatusesDatex2-37.handler",
        tookMs: Date.now() - start,
      });
    });
};
