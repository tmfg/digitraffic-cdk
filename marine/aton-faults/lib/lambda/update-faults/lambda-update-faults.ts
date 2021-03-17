import {getFaults} from "../../api/get-faults";
import {saveFaults} from "../../service/faults";
import {Integration} from "../../app-props";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const KEY_SECRET_ID = 'SECRET_ID';
export const KEY_INTEGRATIONS = 'INTEGRATIONS';

const secretId = process.env[KEY_SECRET_ID] as string;
const envValue = process.env[KEY_INTEGRATIONS] as string;
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
