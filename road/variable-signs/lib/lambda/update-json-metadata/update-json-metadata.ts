import * as JsonUpdateService from "../../service/json-update-service";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { StatusCodeValue } from "../../model/status-code-value";
import { TloikMetatiedot } from "../../model/metatiedot";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>) => {
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
                    tookMs: Date.now() - start
                })
            )
            .catch(() => StatusCodeValue.INTERNAL_ERROR);
    }

    return Promise.resolve(StatusCodeValue.BAD_REQUEST);
};
