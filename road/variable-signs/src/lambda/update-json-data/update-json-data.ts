import * as JsonUpdateService from "../../service/json-update-service.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { type StatusCodeValue, StatusCodeValues } from "../../model/status-code-value.js";
import type { TloikTilatiedot } from "../../model/tilatiedot.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>): Promise<StatusCodeValue> => {
    const jsonData = event["body"];
    const start = Date.now();

    if (jsonData) {
        const tilatiedot = JSON.parse(jsonData) as unknown as TloikTilatiedot;

        return proxyHolder
            .setCredentials()
            .then(() => JsonUpdateService.updateJsonData(tilatiedot))
            .finally(() =>
                logger.info({
                    method: "UpdateJsonData.handler",
                    tookMs: Date.now() - start
                })
            )
            .catch(() => StatusCodeValues.INTERNAL_ERROR);
    }

    return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
