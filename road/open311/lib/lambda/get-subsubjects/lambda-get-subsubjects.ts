import {findAll} from "../../service/subsubjects";
import {DigitrafficApiSubSubject} from "../../model/subsubject";
import {SubjectLocale} from "../../model/subject";
import {LocaleEvent} from "../lambda-common";

export const handler = async (event: LocaleEvent): Promise<DigitrafficApiSubSubject[]> => {
    return (await findAll(event.locale && event.locale.length ? event.locale : SubjectLocale.ENGLISH)).map( s => ({
        active: s.active,
        name: s.name,
        id: s.id,
        locale: s.locale,
        subjectId: s.subject_id
    }));
};
