import * as VariableSignsService from "../../service/variable-signs";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = () => {
    const start = Date.now();

    return proxyHolder.setCredentials()
        .then(() => VariableSignsService.findActiveSignsDatex2())
        .finally(() => {
            console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
        });
};
