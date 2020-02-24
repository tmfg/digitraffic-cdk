import {findAllFaultsS124} from "../../service/faults";

export const handler = async () : Promise <any> => {
    return await findAllFaultsS124();
};
