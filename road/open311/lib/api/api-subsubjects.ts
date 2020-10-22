import {Locale} from '../model/locale';
import {SubSubject} from '../model/subsubject';
import {getXml} from './xmlapiutils';

export async function getSubSubjects(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale
): Promise<SubSubject[]> {
    const parsedSubSubjects: SubSubjectsResponse = await getXml(endpointUser,
        endpointPass,
        endpointUrl,
        `/subsubjects?locale=${locale}`);
    return responseToSubjects(parsedSubSubjects)
        .filter(s => s.locale == locale); // integration returns mixed locales
}

interface SubSubjectsResponse {
    readonly subsubjects: SubSubjectResponseWrapper;
}

interface SubSubjectResponseWrapper {
    readonly subsubject: SubSubjectResponse[];
}

// properties deserialized as singleton arrays
interface SubSubjectResponse {
    readonly active: number[]
    readonly name: string[]
    readonly id: number[]
    readonly locale: string[]
    readonly subject_id: number[]
}

function responseToSubjects(response: SubSubjectsResponse): SubSubject[] {
    return response.subsubjects.subsubject.map(s => ({
        active: s.active[0],
        name: s.name[0],
        id: s.id[0],
        locale: s.locale[0] as Locale,
        subject_id: s.subject_id[0]
    }));
}
