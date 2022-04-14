import * as JsonUpdateService from "../../service/json-update-service";
import {ProxyHolder} from "digitraffic-common/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

export const handler = async (event: Record<string, string>) => {
    const jsonData = event.body;

    if (jsonData) {
        console.info('DEBUG ' + jsonData);

        return proxyHolder.setCredentials()
            .then(() => JsonUpdateService.updateJsonData(JSON.parse(jsonData)))
            .catch(() => ({
                statusCode: 500,
            }));
    }
    return {statusCode:400};
};
