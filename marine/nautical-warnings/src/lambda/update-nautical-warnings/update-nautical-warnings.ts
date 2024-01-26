import type { NauticalWarningsSecret } from "../../model/secret.js";
import * as NauticalWarningsService from "../../service/nautical-warnings.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<NauticalWarningsSecret>("nauticalwarnings");

export const handler: () => Promise<void> = () => {
    const start = Date.now();
    return proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret) => NauticalWarningsService.updateNauticalWarnings(secret.url))
        .finally(() => {
            logger.info({
                method: "UpdateNauticalWarnings.handler",
                tookMs: Date.now() - start
            });
        });
};
