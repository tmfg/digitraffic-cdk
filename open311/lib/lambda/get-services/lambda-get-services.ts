import {findAll} from "../../service/services";
import {IDatabase} from "pg-promise";

export const handler = async (
    event: any,
    context: any,
    callback: any,
    dbParam?: IDatabase<any, any>
): Promise<any> => {
    return await findAll(dbParam);
};
