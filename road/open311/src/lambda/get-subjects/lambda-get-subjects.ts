import * as SubjectsService from "../../service/subjects.js";
import type { Subject } from "../../model/subject.js";
import type { LocaleEvent } from "../lambda-common.js";
import { Locale } from "../../model/locale.js";

export const handler = (event: LocaleEvent): Promise<Subject[]> => {
    return SubjectsService.findAll(event.locale && event.locale.length ? event.locale : Locale.ENGLISH);
};
