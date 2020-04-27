import {findAll} from "../../service/requests";
import {IDatabase} from "pg-promise";

export const handler = async (
    event: {extensions: string},
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<any> => {
    return await findAll(/true/.test(event.extensions), dbParam);
};
