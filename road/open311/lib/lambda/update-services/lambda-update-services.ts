import * as ServicesApi from "../../api/services";
import {update} from "../../service/services";

export const handler = async (): Promise<void> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const services = await ServicesApi.getServices(endpointUser, endpointPass, endpointUrl);
    await update(services);
};
