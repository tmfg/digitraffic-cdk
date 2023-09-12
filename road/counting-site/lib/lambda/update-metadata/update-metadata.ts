import * as UpdateService from "../../service/update";
import { CountingSitesSecret } from "../../model/counting-sites-secret";
import { CountingSitesEnvKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
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
        .then((secret) => UpdateService.updateMetadataForDomain(domainName, secret.apiKey, secret.url))
        .catch((error: Error) => {
            logException(logger, error);
        })
        .finally(() => {
            logger.info({
                method: `updateMetadata.${domainName}`,
                tookMs: Date.now() - start
            });
        });
};
