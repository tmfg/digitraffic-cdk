import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { updateVisits } from "../../service/visit-service.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { PortCallSecret } from "../../model/secret.js";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<PortCallSecret>("port-call");

export const handler = async (): Promise<void> => {
    const start = Date.now();

    try {
        await proxyHolder.setCredentials();
        const secret = await secretHolder.get();

        const updated = await updateVisits(secret.url, decodeBase64ToAscii(secret.privateKey), decodeBase64ToAscii(secret.certificate));

        logger.info({
            method: "UpdateVisits.handler",
            customUpdatedCount: updated.updated,
            customInsertedCount: updated.inserted
        });

    } catch (error) {
        logger.debug("got error " + JSON.stringify(error));

//        logException(logger, error, true);
    } finally {
        logger.info({
            method: "UpdateVisits.handler",
            tookMs: Date.now() - start
        });
    }
};