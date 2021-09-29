import * as UpdateService from "../../service/update";
import {CountingSitesSecret} from "../../model/counting-sites-secret";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";
import { CountingSitesEnvKeys } from "../../keys";

const secretId = process.env[SECRET_ID_KEY] as string;
const domainName = process.env[CountingSitesEnvKeys.DOMAIN_NAME] as string;
const domainPrefix = process.env[CountingSitesEnvKeys.DOMAIN_PREFIX] as string;

export const handler = async (event: any): Promise<any> => {
    const start = Date.now();

    try {
        await withDbSecret(secretId, (secret: CountingSitesSecret) => {
            return UpdateService.updateMetadataForDomain(domainName, secret.apiKey, secret.url);
        }, {
            prefix: domainPrefix
        });
    } finally {
        console.info("method=updateMetadata.%s tookMs=%d", domainName, (Date.now()-start));
    }
};
