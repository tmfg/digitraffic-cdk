import * as Datex2UpdateService from "../../service/datex2-update-service";
import {ProxyHolder} from "@digitraffic/common/aws/runtime/secrets/proxy-holder";
import {StatusCodeValue} from "../../model/status-code-value";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>) => {
    const datex2 = event.body;
    const start = Date.now();

    if (datex2) {
        console.info('DEBUG ' + datex2);

        return proxyHolder.setCredentials()
            .then(() => Datex2UpdateService.updateDatex2(datex2))
            .finally(() => console.info("method=Lambda.UpdateDatex2Data tookMs=%d", Date.now() - start))
            .catch(() => StatusCodeValue.INTERNAL_ERROR);
    }

    return Promise.resolve(StatusCodeValue.BAD_REQUEST);
};
