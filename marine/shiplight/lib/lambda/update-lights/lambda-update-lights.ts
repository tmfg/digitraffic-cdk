import * as AreaTrafficService from '../../service/areatraffic';
import {ShiplightEnvKeys, ShiplightSecretKeys} from "../../keys";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AreaTraffic} from "../../model/areatraffic";
import {updateLightsForArea} from "../../api/arealights";

const secretId = process.env[ShiplightEnvKeys.SECRET_ID] as string;

export async function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any) => any,
    updateLightsForAreaFn: (area: AreaTraffic, apiKey: string, endpointUrl: string) => any
) {
    return doWithSecret(secretId, async (secret: any) => {
        const areas = await AreaTrafficService.getAreaTraffic();

        for (const area of areas) {
            console.info("method=shiplightHandler sourceId=%d", area.areaId);

            try {
                await updateLightsForAreaFn(area, secret[ShiplightSecretKeys.API_KEY], secret[ShiplightSecretKeys.ENDPOINT_URL]);
                await AreaTrafficService.updateAreaTrafficSendTime(area.areaId);
            } catch(e) {
                console.log("method=shiplightHandler failed:" + JSON.stringify(e));
            }
        }
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withDbSecret, updateLightsDebug);
};

async function updateLightsDebug(areaTraffic: AreaTraffic, apiKey: string, endpointUrl: string): Promise<any> {
    console.log("Sending update " + JSON.stringify(areaTraffic));
}
