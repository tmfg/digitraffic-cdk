import {getFaults} from "../../api/get-faults";
import {saveFaults} from "../../service/faults";
import {Integration} from "../../app-props.d";

const envValue = process.env.INTEGRATIONS as string;
const integrations = JSON.parse(envValue) as Integration[];

export const handler = async () : Promise <any> => {
    await updateAllFaults();
};

async function updateAllFaults(): Promise<any> {
    for(const i of integrations) {
        const newFaults = await getFaults(i.url);

        await saveFaults(i.domain, newFaults);
    }
}
