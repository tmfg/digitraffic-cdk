import * as CountingSitesService from "../../service/counting-sites";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = async () => {
    const start = Date.now();

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.getDomains())
        .finally(() => {
            console.info("method=CountingSites.GetDomains tookMs=%d", (Date.now() - start));
        });
};
