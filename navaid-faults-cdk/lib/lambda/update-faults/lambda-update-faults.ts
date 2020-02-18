import {getFaults} from "../../../api/get-faults";
import {Fault} from "../../../model/fault";

export const handler = async () : Promise <any> => {
    await updateAllFaults();
};

async function updateAllFaults(): Promise<any> {
    const urls = (process.env.ENDPOINT_URLS || "").split(',');

    for(const url of urls) {
        const newFaults = await getFaults(url);

        await saveFaults(newFaults);
    }
}

async function saveFaults(faults: Fault[]) {
    console.info("saving faults " + faults.length);
}
