import * as ServicesApi from "../../api/services.js";
import { update } from "../../service/services.js";

const endpointUser = process.env["ENDPOINT_USER"]!;
const endpointPass = process.env["ENDPOINT_PASS"]!;
const endpointUrl = process.env["ENDPOINT_URL"]!;

export const handler = async (): Promise<void> => {
    const services = await ServicesApi.getServices(endpointUser, endpointPass, endpointUrl);
    await update(services);
};
