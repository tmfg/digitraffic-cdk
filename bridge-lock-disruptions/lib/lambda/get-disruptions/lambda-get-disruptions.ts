import {findAllDisruptions} from "../../service/disruptions";

export const handler = async (): Promise<any> => {
    return await findAllDisruptions();
};
