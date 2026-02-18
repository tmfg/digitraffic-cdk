import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { CountingSitesEnvKeys } from "../../keys.js";
import type { CountingSitesSecret } from "../../model/counting-sites-secret.js";
import type { Domain } from "../../model/v2/types.js";
import { updateMetadata } from "../../service/update-service.js";

const domainName = getEnvVariable(CountingSitesEnvKeys.DOMAIN_NAME) as Domain;

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<CountingSitesSecret>("cs");

export const handler = async (): Promise<void> => {
  const start = Date.now();

  await proxyHolder
    .setCredentials()
    .then(() => secretHolder.get())
    .then((secret) => updateMetadata(secret.url, secret.apiKey, domainName))
    .catch((error: Error) => {
      logException(logger, error);
    })
    .finally(() => {
      logger.info({
        method: `updateMetadata.${domainName}`,
        tookMs: Date.now() - start,
      });
    });
};
