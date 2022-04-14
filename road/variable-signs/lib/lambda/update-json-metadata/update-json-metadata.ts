import * as JsonUpdateService from "../../service/json-update-service";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";
import {StatusCodeValue} from "../../model/status-code-value";

const proxyHolder = ProxyHolder.create();

export const handler = async (event: Record<string, string>) => {
    const jsonMetadata = event.body;

    if (jsonMetadata) {
        console.info('DEBUG ' + jsonMetadata);

        return proxyHolder.setCredentials()
            .then(() => JsonUpdateService.updateJsonMetadata(JSON.parse(jsonMetadata)))
            .catch(() => StatusCodeValue.INTERNAL_ERROR);
    }

    return StatusCodeValue.BAD_REQUEST;
};
