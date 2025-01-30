import * as JsonUpdateService from "../../service/json-update-service.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import {
  type StatusCodeValue,
  StatusCodeValues,
} from "../../model/status-code-value.js";
import type { TloikMetatiedot } from "../../model/metatiedot.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (
  event: Record<string, string>,
): Promise<StatusCodeValue> => {
  // eslint-disable-next-line dot-notation
  const jsonMetadata = event["body"];
  const start = Date.now();

  if (jsonMetadata) {
    const metatiedot = JSON.parse(jsonMetadata) as unknown as TloikMetatiedot;

    return proxyHolder
      .setCredentials()
      .then(() => JsonUpdateService.updateJsonMetadata(metatiedot))
      .finally(() =>
        logger.info({
          method: "UpdateJsonMetadata.handler",
          tookMs: Date.now() - start,
        })
      )
      .catch(() => StatusCodeValues.INTERNAL_ERROR);
  }

  return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
