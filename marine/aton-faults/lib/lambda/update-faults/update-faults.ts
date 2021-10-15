import {getFaults} from "../../api/faults";
import {saveFaults} from "../../service/faults";
import {Integration} from "../../app-props";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "../../keys";

const secretId = process.env[AtonEnvKeys.SECRET_ID] as string;
const envValue = process.env[AtonEnvKeys.INTEGRATIONS] as string;
const integrations = envValue ? JSON.parse(envValue) as Integration[] : [];

export const handler = async () : Promise <any> => {
    await updateAllFaults();
};

async function updateAllFaults(): Promise<any> {
    await withDbSecret(secretId, async () => {
        for(const i of integrations) {
            const newFaults = await getFaults(i.url);
            await saveFaults(i.domain, newFaults);
        }
    });
}
