import * as SubjectsService from "../../service/subjects";
import {Subject} from "../../model/subject";
import {LocaleEvent} from "../lambda-common";
import {Locale} from "../../model/locale";

export const handler = async (event: LocaleEvent): Promise<Subject[]> => {
    return await SubjectsService.findAll(event.locale && event.locale.length ? event.locale : Locale.ENGLISH);
};
