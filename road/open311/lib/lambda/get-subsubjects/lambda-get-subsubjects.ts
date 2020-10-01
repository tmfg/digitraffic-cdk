import {findAll} from "../../service/subsubjects";
import {SubSubject} from "../../model/subsubject";

export const handler = async (): Promise<SubSubject[]> => {
    return await findAll();
};
