import {findAll} from "../../service/subjects";
import {Subject} from "../../model/subject";
import {LocaleEvent} from "../lambda-common";
import {Locale} from "../../model/locale";

export const handler = async (event: LocaleEvent): Promise<Subject[]> => {
    return await findAll(event.locale && event.locale.length ? event.locale : Locale.ENGLISH);
};
