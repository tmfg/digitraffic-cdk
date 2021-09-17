import * as AreaTrafficService from '../../service/areatraffic';
import {ShiplightEnvKeys, ShiplightSecretKeys} from "../../keys";
import {SecretOptions, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AreaTraffic} from "../../model/areatraffic";
import {updateLightsForArea} from "../../api/arealights";

const secretId = process.env[ShiplightEnvKeys.SECRET_ID] as string;

type ShiplightSecret = {
    readonly apiKey: string,
    readonly endpointUrl: string
}

export async function handlerFn(
    doWithSecret: (secretId: string, fn: (secret: any) => any, options: SecretOptions) => any,
    updateLightsForAreaFn: (area: AreaTraffic, apiKey: string, endpointUrl: string) => any
) {
    return doWithSecret(secretId, async (secret: ShiplightSecret) => {
        const areas = await AreaTrafficService.getAreaTraffic();

        for (const area of areas) {
            console.info("method=shiplightHandler sourceId=%d", area.areaId);

            try {
                await updateLightsForAreaFn(area, secret.apiKey, secret.endpointUrl);
                await AreaTrafficService.updateAreaTrafficSendTime(area.areaId);
            } catch(e) {
                console.log("method=shiplightHandler failed:" + JSON.stringify(e));
            }
        }
    }, {
        prefix: 'shiplight'
    });
}

export const handler = async (): Promise<any> => {
    return handlerFn(withDbSecret, updateLightsDebug);
};

async function updateLightsDebug(areaTraffic: AreaTraffic, apiKey: string, endpointUrl: string): Promise<any> {
    console.log("Sending update " + JSON.stringify(areaTraffic));
}
