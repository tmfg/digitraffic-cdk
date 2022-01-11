import * as UpdateService from "../../service/update";
import {CountingSitesSecret} from "../../model/counting-sites-secret";
import {withDbSecret} from "digitraffic-common/aws/runtime/secrets/dbsecret";
import { CountingSitesEnvKeys } from "../../keys";

const secretId = process.env.SECRET_ID as string;
const domainName = process.env[CountingSitesEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[CountingSitesEnvKeys.DOMAIN_PREFIX] as string;

export const handler = async (): Promise<void> => {
    const start = Date.now();

    try {
        await withDbSecret(secretId, (secret: CountingSitesSecret) => {
            return UpdateService.updateDataForDomain(domainName, secret.apiKey, secret.url);
        }, {
            prefix: domainPrefix,
        });
    } finally {
        console.info("method=updateData.%s tookMs=%d", domainName, (Date.now()-start));
    }
};
