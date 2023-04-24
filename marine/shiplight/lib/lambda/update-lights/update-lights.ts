import * as AreaTrafficService from "../../service/areatraffic";
import { ShiplightSecret } from "../../model/shiplight-secret";
import { AreaVisibilityApi } from "../../api/areavisibility";
import { AreaVisibilityService } from "../../service/areavisibility";
import { AreaLightsApi } from "../../api/arealights";
import { AreaLightsService } from "../../service/arealights";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";

const secretHolder = SecretHolder.create<ShiplightSecret>("shiplight");
const proxyHolder = ProxyHolder.create();

let visibilityApi: AreaVisibilityApi | undefined;
let lightsApi: AreaLightsApi | undefined;

export async function handlerFn(
    AreaVisibilityServiceClass: new (api: AreaVisibilityApi) => AreaVisibilityService,
    AreaLightsServiceClass: new (api: AreaLightsApi) => AreaLightsService
): Promise<void> {
    return secretHolder.get().then(async (secret) => {
        await proxyHolder.setCredentials();

        if (!visibilityApi) {
            visibilityApi = new AreaVisibilityApi(secret.visibilityEndpointUrl, secret.visibilityApiKey);
        }
        const visibilityService = new AreaVisibilityServiceClass(visibilityApi);

        if (!lightsApi) {
            lightsApi = new AreaLightsApi(secret.lightsControlEndpointUrl, secret.lightsControlApiKey);
        }
        const lightsService = new AreaLightsServiceClass(lightsApi);

        const areas = await AreaTrafficService.getAreaTraffic();

        for (const area of areas) {
            logger.info({
                method: "UpdateLights.handler",
                sourceId: area.areaId
            });

            try {
                const visibility = await visibilityService.getVisibilityForAreaInMetres(area.areaId);
                await lightsService.updateLightsForArea({
                    ...area,
                    ...{
                        visibilityInMeters: visibility.visibilityInMeters
                    }
                });
                await AreaTrafficService.updateAreaTrafficSendTime(area.areaId);
            } catch (e) {
                logException(logger, e as Error);
            }
        }
    });
}

export const handler = (): Promise<void> => {
    return handlerFn(AreaVisibilityService, AreaLightsService);
};
