import {findActiveSignsDatex2} from "../../service/variable-sign-service";

export const handler = async (event: any): Promise<any> => {
    return await findActiveSignsDatex2();
};
