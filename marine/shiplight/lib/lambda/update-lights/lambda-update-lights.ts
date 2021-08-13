import * as AreaTrafficService from '../../service/areatraffic';
import {ShiplightEnvKeys} from "../../keys";
import {withSecret} from "digitraffic-common/secrets/secret";
import {ShiplightSecret} from "../../model/shiplight-secret";
import {updateLightsForArea} from "../../api/arealights";
import {AreaTraffic} from "../../model/areatraffic";

const secretId = process.env[ShiplightEnvKeys.SECRET_ID] as string;

export async function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any,
    updateLightsForAreaFn: (area: AreaTraffic, endpointUrl: string) => any
) {
    return doWithSecret(secretId, async (secret: ShiplightSecret) => {
        const areas = await AreaTrafficService.getAreaTraffic();

        for (const area of areas) {
            await updateLightsForAreaFn(area, secret.endpointUrl);
        }
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withSecret, updateLightsForArea);
};