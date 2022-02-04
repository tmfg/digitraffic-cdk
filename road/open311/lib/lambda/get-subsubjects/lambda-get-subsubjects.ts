import * as SubSubjectsService from "../../service/subsubjects";
import {DigitrafficApiSubSubject} from "../../model/subsubject";
import {Locale} from "../../model/locale";
import {LocaleEvent} from "../lambda-common";

export const handler = async (event: LocaleEvent): Promise<DigitrafficApiSubSubject[]> => {
    return (await SubSubjectsService.findAll(event.locale && event.locale.length ? event.locale : Locale.ENGLISH)).map( s => ({
        active: s.active,
        name: s.name,
        id: s.id,
        locale: s.locale,
        subjectId: s.subject_id,
    }));
};
