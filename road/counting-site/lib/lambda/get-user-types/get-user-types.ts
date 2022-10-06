import * as CountingSitesService from "../../service/counting-sites";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    const start = Date.now();

    return proxyHolder.setCredentials()
        .then(() => CountingSitesService.getUserTypes())
        .finally(() => {
            console.info("method=CountingSites.GetUserTypes tookMs=%d", (Date.now() - start));
        });
};

