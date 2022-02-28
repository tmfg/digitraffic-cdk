import * as UpdateService from "../../service/update";
import {CountingSitesEnvKeys} from "../../keys";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";
import {CountingSitesSecret} from "../../model/counting-sites-secret";

const domainName = process.env[CountingSitesEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[CountingSitesEnvKeys.DOMAIN_PREFIX] as string;

const holder = SecretHolder.create<CountingSitesSecret>(domainPrefix);

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    try {
        const secret = await holder.get();

        return UpdateService.updateDataForDomain(domainName, secret.apiKey, secret.url);
    } finally {
        console.info("method=updateData.%s tookMs=%d", domainName, (Date.now()-start));
    }
};
