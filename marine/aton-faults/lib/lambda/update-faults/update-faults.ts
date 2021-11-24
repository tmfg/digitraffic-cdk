import {getFaults} from "../../api/faults";
import {saveFaults} from "../../service/faults";
import {Integration} from "../../app-props";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "../../keys";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;
const envValue = process.env[AtonEnvKeys.INTEGRATIONS] as string;
const integrations = envValue ? JSON.parse(envValue) as Integration[] : [];

export const handler = async () : Promise <void> => {
    return updateAllFaults();
};

async function updateAllFaults(): Promise<void> {
    return withDbSecret(secretId, async () => {
        for(const i of integrations) {
            const newFaults = await getFaults(i.url);
            await saveFaults(i.domain, newFaults);
        }
    });
}
