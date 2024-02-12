import * as ServicesApi from "../../api/services.js";
import { update } from "../../service/services.js";

// eslint-disable-next-line dot-notation
const endpointUser = process.env["ENDPOINT_USER"];
// eslint-disable-next-line dot-notation
const endpointPass = process.env["ENDPOINT_PASS"];
// eslint-disable-next-line dot-notation
const endpointUrl = process.env["ENDPOINT_URL"];

export const handler = async (): Promise<void> => {
    if (!endpointUser || !endpointPass || !endpointUrl) {
        throw new Error("Env variables are not set!");
    }
    const services = await ServicesApi.getServices(endpointUser, endpointPass, endpointUrl);
    await update(services);
};
