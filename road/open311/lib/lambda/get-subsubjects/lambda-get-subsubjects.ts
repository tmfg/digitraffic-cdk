import {findAll} from "../../service/subsubjects";
import {SubSubject} from "../../model/subsubject";
import {SubjectLocale} from "../../model/subject";
import {LocaleEvent} from "../lambda-common";

export const handler = async (event: LocaleEvent): Promise<SubSubject[]> => {
    return await findAll(event.locale ?? SubjectLocale.ENGLISH);
};
