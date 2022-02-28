import * as CountingSitesService from "../../service/counting-sites";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const holder = SecretHolder.create();

export const handler = async () => {
    await holder.setDatabaseCredentials();

    const start = Date.now();

    return CountingSitesService.getUserTypes().finally(() => {
        console.info("method=CountingSites.GetUserTypes tookMs=%d", (Date.now() - start));
    });
};

