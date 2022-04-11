import * as UpdateService from "../../service/update";
import {CountingSitesEnvKeys} from "../../keys";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";
import {CountingSitesSecret} from "../../model/counting-sites-secret";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const domainName = process.env[CountingSitesEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[CountingSitesEnvKeys.DOMAIN_PREFIX] as string;

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<CountingSitesSecret>(domainPrefix);

export const handler = () => {
    const start = Date.now();

    proxyHolder.setCredentials()
        .then(() => secretHolder.get())
        .then(secret => UpdateService.updateDataForDomain(domainName, secret.apiKey, secret.url))
        .finally(() => {
            console.info("method=updateData.%s tookMs=%d", domainName, (Date.now()-start));
        });
};
