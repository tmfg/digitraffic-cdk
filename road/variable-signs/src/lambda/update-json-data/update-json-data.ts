import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { StatusCodeValue } from "../../model/status-code-value.js";
import { StatusCodeValues } from "../../model/status-code-value.js";
import type { TloikTilatiedot } from "../../model/tilatiedot.js";
import { updateJsonData } from "../../service/json-update-service.js";
import type { BodyEvent } from "../update-datex2/update-datex2.js";

const proxyHolder = ProxyHolder.create();

export const handler = (event: BodyEvent): Promise<StatusCodeValue> => {
  const jsonData = event.body;
  const start = Date.now();

  if (jsonData) {
    const tilatiedot = JSON.parse(jsonData) as unknown as TloikTilatiedot;

    return proxyHolder
      .setCredentials()
      .then(() => updateJsonData(tilatiedot))
      .finally(() =>
        logger.info({
          method: "UpdateJsonData.handler",
          tookMs: Date.now() - start,
        }),
      )
      .catch(() => StatusCodeValues.INTERNAL_ERROR);
  }

  return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
