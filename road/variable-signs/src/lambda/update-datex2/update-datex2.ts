import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { StatusCodeValue } from "../../model/status-code-value.js";
import { StatusCodeValues } from "../../model/status-code-value.js";
import { updateDatex2 } from "../../service/datex2-update-service.js";

const proxyHolder = ProxyHolder.create();

export interface BodyEvent {
  body: string;
}

export const handler = (event: BodyEvent): Promise<StatusCodeValue> => {
  const datex2 = event.body;
  const start = Date.now();

  if (datex2) {
    //    logger.debug(datex2);

    return proxyHolder
      .setCredentials()
      .then(() => updateDatex2(datex2))
      .finally(() =>
        logger.info({
          method: "UpdateDatex2.handler",
          tookMs: Date.now() - start,
        }),
      )
      .catch(() => StatusCodeValues.INTERNAL_ERROR);
  }

  return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
