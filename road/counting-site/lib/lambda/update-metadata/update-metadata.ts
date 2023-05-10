import * as UpdateService from "../../service/update";
import { CountingSitesSecret } from "../../model/counting-sites-secret";
import { CountingSitesEnvKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const domainName = envValue(CountingSitesEnvKeys.DOMAIN_NAME);
const domainPrefix = envValue(CountingSitesEnvKeys.DOMAIN_PREFIX);

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<CountingSitesSecret>(domainPrefix);

export const handler = async (): Promise<void> => {
    const start = Date.now();

    await proxyHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret) => UpdateService.updateMetadataForDomain(domainName, secret.apiKey, secret.url))
        .finally(() => {
            console.info("method=updateMetadata.%s tookMs=%d", domainName, Date.now() - start);
        });
};
