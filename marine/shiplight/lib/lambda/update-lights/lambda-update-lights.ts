import * as AreaTrafficService from '../../service/areatraffic';
import {ShiplightEnvKeys, ShiplightSecretKeys} from "../../keys";
import {withSecret} from "digitraffic-common/secrets/secret";
import {updateLightsForArea} from "../../api/arealights";
import {AreaTraffic} from "../../model/areatraffic";

const secretId = process.env[ShiplightEnvKeys.SECRET_ID] as string;

export async function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any,
    updateLightsForAreaFn: (area: AreaTraffic, apiKey: string, endpointUrl: string) => any
) {
    return doWithSecret(secretId, async (secret: any) => {
        const areas = await AreaTrafficService.getAreaTraffic();

        for (const area of areas) {
            await updateLightsForAreaFn(area, secret[ShiplightSecretKeys.API_KEY], secret[ShiplightSecretKeys.ENDPOINT_URL]);
        }
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withSecret, updateLightsForArea);
};