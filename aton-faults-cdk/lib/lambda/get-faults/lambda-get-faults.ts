import {findAllFaults} from "../../service/faults";

export const handler = async () : Promise <any> => {
    return await findAllFaults();
};
