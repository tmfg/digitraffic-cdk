import {findAll} from "../../service/services";

export const handler = async (): Promise<any> => {
    return await findAll();
};
