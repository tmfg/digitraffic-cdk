import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import {
  type StatusCodeValue,
  StatusCodeValues,
} from "../../model/status-code-value.js";
import type { TloikTilatiedot } from "../../model/tilatiedot.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { updateJsonData } from "../../service/json-update-service.js";

const proxyHolder = ProxyHolder.create();

export const handler = (
  event: Record<string, string>,
): Promise<StatusCodeValue> => {
  // eslint-disable-next-line dot-notation
  const jsonData = event["body"];
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
        })
      )
      .catch(() => StatusCodeValues.INTERNAL_ERROR);
  }

  return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
