import {findAllActiveAnnotations} from "../../service/annotations";

export const handler = async (event: any): Promise<any> => {
    return await findAllActiveAnnotations();
};

