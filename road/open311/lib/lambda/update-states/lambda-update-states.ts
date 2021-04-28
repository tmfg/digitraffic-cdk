import * as StatesApi from "../../api/states";
import {update} from "../../service/states";
import {Locale} from "../../model/locale";

export const handler = async (): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const states = await Promise.all([
        StatesApi.getStates(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        StatesApi.getStates(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH)
    ]);
    await update(states.flat());
};
