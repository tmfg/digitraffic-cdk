import * as AreaTrafficService from "../../service/areatraffic";
import { ShiplightEnvKeys } from "../../keys";
import {
    SecretFunction,
    withDbSecret,
} from "@digitraffic/common/dist/aws/runtime/secrets/dbsecret";
import { ShiplightSecret } from "../../model/shiplight-secret";
import { AreaVisibilityApi } from "../../api/areavisibility";
import { AreaVisibilityService } from "../../service/areavisibility";
import { AreaLightsApi } from "../../api/arealights";
import { AreaLightsService } from "../../service/arealights";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const secretId = envValue(ShiplightEnvKeys.SECRET_ID);

let visibilityApi: AreaVisibilityApi | undefined;
let lightsApi: AreaLightsApi | undefined;

export async function handlerFn(
    doWithSecret: SecretFunction<ShiplightSecret>,
    AreaVisibilityServiceClass: new (
        api: AreaVisibilityApi
    ) => AreaVisibilityService,
    AreaLightsServiceClass: new (api: AreaLightsApi) => AreaLightsService
): Promise<void> {
    return doWithSecret(
        secretId,
        async (secret: ShiplightSecret) => {
            if (!visibilityApi) {
                visibilityApi = new AreaVisibilityApi(
                    secret.visibilityEndpointUrl,
                    secret.visibilityApiKey
                );
            }
            const visibilityService = new AreaVisibilityServiceClass(
                visibilityApi
            );

            if (!lightsApi) {
                lightsApi = new AreaLightsApi(
                    secret.lightsControlEndpointUrl,
                    secret.lightsControlApiKey
                );
            }
            const lightsService = new AreaLightsServiceClass(lightsApi);

            const areas = await AreaTrafficService.getAreaTraffic();

            for (const area of areas) {
                console.info(
                    "method=shiplightHandler sourceId=%d",
                    area.areaId
                );

                try {
                    const visibility =
                        await visibilityService.getVisibilityForAreaInMetres(
                            area.areaId
                        );
                    await lightsService.updateLightsForArea({
                        ...area,
                        ...{
                            visibilityInMeters: visibility.visibilityInMeters,
                        },
                    });
                    await AreaTrafficService.updateAreaTrafficSendTime(
                        area.areaId
                    );
                } catch (e) {
                    console.log(
                        "method=shiplightHandler failed:" + JSON.stringify(e)
                    );
                }
            }
        },
        {
            prefix: "shiplight",
        }
    );
}

export const handler = (): Promise<void> => {
    return handlerFn(withDbSecret, AreaVisibilityService, AreaLightsService);
};
