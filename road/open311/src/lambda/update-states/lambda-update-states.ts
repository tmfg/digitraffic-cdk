import * as StatesApi from "../../api/states.js";
import { update } from "../../service/states.js";
import { Locale } from "../../model/locale.js";

const endpointUser = process.env["ENDPOINT_USER"];
const endpointPass = process.env["ENDPOINT_PASS"];
const endpointUrl = process.env["ENDPOINT_URL"];

export const handler = async (): Promise<void> => {
    if (!endpointUser || !endpointPass || !endpointUrl) {
        throw new Error("Env variables are not set!");
    }
    const states = await Promise.all([
        StatesApi.getStates(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        StatesApi.getStates(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH)
    ]);
    await update(states.flat());
};
