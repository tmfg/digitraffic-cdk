import * as Datex2UpdateService from "../../service/datex2-update-service.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { type StatusCodeValue, StatusCodeValues } from "../../model/status-code-value.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>): Promise<StatusCodeValue> => {
    // eslint-disable-next-line dot-notation
    const datex2 = event["body"];
    const start = Date.now();

    if (datex2) {
        logger.debug(datex2);

        return proxyHolder
            .setCredentials()
            .then(() => Datex2UpdateService.updateDatex2(datex2))
            .finally(() =>
                logger.info({
                    method: "UpdateDatex2.handler",
                    tookMs: Date.now() - start
                })
            )
            .catch(() => StatusCodeValues.INTERNAL_ERROR);
    }

    return Promise.resolve(StatusCodeValues.BAD_REQUEST);
};
