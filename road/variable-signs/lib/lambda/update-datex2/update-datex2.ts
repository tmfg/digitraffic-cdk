import * as Datex2UpdateService from "../../service/datex2-update-service";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";
import {StatusCodeValue} from "../../model/status-code-value";

const proxyHolder = ProxyHolder.create();

export const handler = async (event: Record<string, string>) : Promise<StatusCodeValue | void> => {
    const datex2 = event.body;

    if (datex2) {
        console.info('DEBUG ' + datex2);

        return proxyHolder.setCredentials()
            .then(() => Datex2UpdateService.updateDatex2(datex2))
            .catch(() => StatusCodeValue.INTERNAL_ERROR);
    }

    return StatusCodeValue.BAD_REQUEST;
};
