import {findAll} from "../../service/subjects";
import {Subject} from "../../model/subject";

export const handler = async (): Promise<Subject[]> => {
    return await findAll();
};
