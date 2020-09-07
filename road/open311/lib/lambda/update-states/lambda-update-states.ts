import {getStates} from "../../api/api-states";
import {update} from "../../service/states";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    try {
        const services = await getStates(endpointUser, endpointPass, endpointUrl);
        await update(services);
    } catch (e) {
        console.error('Error', e);
        return;
    }
};
