import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { TloikMetatiedot } from "../../model/metatiedot.js";
import type { StatusCodeValue } from "../../model/status-code-value.js";
import { StatusCodeValues } from "../../model/status-code-value.js";
import * as JsonUpdateService from "../../service/json-update-service.js";
import type { BodyEvent } from "../update-datex2/update-datex2.js";

const proxyHolder = ProxyHolder.create();

export const handler = (event: BodyEvent): Promise<StatusCodeValue> => {
  const jsonMetadata = event.body;
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
        }),
      )
      .catch(() => StatusCodeValues.INTERNAL_ERROR);
  }

  return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
