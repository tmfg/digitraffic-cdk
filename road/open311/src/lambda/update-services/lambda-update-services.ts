import * as ServicesApi from "../../api/services.js";
import { update } from "../../service/services.js";

const endpointUser = process.env["ENDPOINT_USER"];
const endpointPass = process.env["ENDPOINT_PASS"];
const endpointUrl = process.env["ENDPOINT_URL"];

export const handler = async (): Promise<void> => {
    if (!endpointUser || !endpointPass || !endpointUrl) {
        throw new Error("Env variables are not set!");
    }
    const services = await ServicesApi.getServices(endpointUser, endpointPass, endpointUrl);
    await update(services);
};
