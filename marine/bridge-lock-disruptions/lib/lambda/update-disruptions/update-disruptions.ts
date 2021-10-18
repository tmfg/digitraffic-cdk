import {fetchRemoteDisruptions, saveDisruptions} from "../../service/disruptions";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";

export const handler = async () : Promise <any> => {
    return handlerFn(withDbSecret);
};

export function handlerFn(withDbSecretFn: (secretId: string, fn: (secret: any) => Promise<void>) => Promise<any>): Promise<any> {
    return withDbSecretFn(process.env.SECRET_ID as string, async (secret: any) => {
        const disruptions = await fetchRemoteDisruptions(secret['waterwaydisturbances.url'] as string);
        await saveDisruptions(disruptions);
    });
}
