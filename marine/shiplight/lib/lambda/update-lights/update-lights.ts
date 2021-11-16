import * as AreaTrafficService from '../../service/areatraffic';
import {ShiplightEnvKeys} from "../../keys";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {ShiplightSecret} from "../../model/shiplight-secret";
import {AreaVisibilityApi} from "../../api/areavisibility";
import {AreaVisibilityService} from "../../service/areavisibility";
import {AreaLightsApi} from "../../api/arealights";
import {AreaLightsService} from "../../service/arealights";

const secretId = process.env[ShiplightEnvKeys.SECRET_ID] as string;

let visibilityApi: AreaVisibilityApi;
let lightsApi: AreaLightsApi

export async function handlerFn(
    doWithSecret: SecretFunction,
    AreaVisibilityServiceClass: new (api: AreaVisibilityApi) => AreaVisibilityService,
    AreaLightsServiceClass: new (api: AreaLightsApi) => AreaLightsService) {

    return doWithSecret(secretId, async (secret: ShiplightSecret) => {
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
            console.info("method=shiplightHandler sourceId=%d", area.areaId);

            try {
                const visibility = await visibilityService.getVisibilityForAreaInMetres(area.areaId);
                await lightsService.updateLightsForArea({ ...area, ...{
                    visibilityInMetres: visibility.visibilityInMetres
                }});
                await AreaTrafficService.updateAreaTrafficSendTime(area.areaId);
            } catch (e) {
                console.log("method=shiplightHandler failed:" + JSON.stringify(e));
            }
        }
    }, {
        prefix: 'shiplight'
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withDbSecret, AreaVisibilityService, AreaLightsService);
};

