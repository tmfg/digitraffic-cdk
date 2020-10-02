import {findAll} from "../../service/subjects";
import {Subject, SubjectLocale} from "../../model/subject";
import {LocaleEvent} from "../lambda-common";

export const handler = async (event: LocaleEvent): Promise<Subject[]> => {
    return await findAll(event.locale && event.locale.length ? event.locale : SubjectLocale.ENGLISH);
};
