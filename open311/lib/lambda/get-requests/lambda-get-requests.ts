import {findAll} from "../../service/requests";

export const handler = async (
    event: {extensions: string}
): Promise<any> => {
    return await findAll(/true/.test(event.extensions));
};
