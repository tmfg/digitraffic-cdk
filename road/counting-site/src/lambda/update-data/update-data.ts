import * as UpdateService from "../../service/update.js";
import { CountingSitesEnvKeys } from "../../keys.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { CountingSitesSecret } from "../../model/counting-sites-secret.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

const domainName = getEnvVariable(CountingSitesEnvKeys.DOMAIN_NAME);
const domainPrefix = getEnvVariable(CountingSitesEnvKeys.DOMAIN_PREFIX);

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<CountingSitesSecret>(domainPrefix);

export const handler = async (): Promise<void> => {
    const start = Date.now();

    await proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret) => UpdateService.updateDataForDomain(domainName, secret.apiKey, secret.url))
        .catch((error: Error) => {
            logException(logger, error);
        })
        .finally(() => {
            logger.info({
                method: `updateData.${domainName}`,
                tookMs: Date.now() - start
            });
        });
};
