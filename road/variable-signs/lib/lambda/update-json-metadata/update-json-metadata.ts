import * as JsonUpdateService from "../../service/json-update-service";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";
import {StatusCodeValue} from "../../model/status-code-value";

const proxyHolder = ProxyHolder.create();

export const handler = (event: Record<string, string>) => {
    const jsonMetadata = event.body;
    const start = Date.now();

    if (jsonMetadata) {
        console.info('DEBUG ' + jsonMetadata);

        return proxyHolder.setCredentials()
            .then(() => JsonUpdateService.updateJsonMetadata(JSON.parse(jsonMetadata)))
            .finally(() => console.info("method=Lambda.UpdateJsonMetadata tookMs=%d", Date.now() - start))
            .catch(() => StatusCodeValue.INTERNAL_ERROR);
    }

    return Promise.resolve(StatusCodeValue.BAD_REQUEST);
};
