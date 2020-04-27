import {IDatabase} from "pg-promise";
import {getServices} from "../../api/api-services";
import {update, findAll} from "../../service/services";

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<any> => {
    const endpointUser = process.env.ENDPOINT_USER as string;
    const endpointPass = process.env.ENDPOINT_PASS as string;
    const endpointUrl = process.env.ENDPOINT_URL as string;
    const services = await getServices(endpointUser, endpointPass, endpointUrl);
    await update(services, dbParam);
};
