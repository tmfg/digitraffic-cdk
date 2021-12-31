import {Subject} from '../model/subject';
import {getXml} from './xmlapiutils';
import {Locale} from '../model/locale';

export async function getSubjects(endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale): Promise<Subject[]> {
    const parsedSubjects: SubjectsResponse = await getXml(endpointUser,
        endpointPass,
        endpointUrl,
        `/subjects?locale=${locale}`);
    return responseToSubjects(parsedSubjects)
        .filter(s => s.locale === locale); // integration returns mixed locales
}

interface SubjectsResponse {
    readonly subjects: SubjectResponseWrapper;
}

interface SubjectResponseWrapper {
    readonly subject: SubjectResponse[];
}

// properties deserialized as singleton arrays
interface SubjectResponse {
    readonly active: number[];
    readonly name: string[];
    readonly id: number[];
    readonly locale: string[];
}

function responseToSubjects(response: SubjectsResponse): Subject[] {
    return response.subjects.subject.map(s => ({
        active: s.active[0],
        name: s.name[0],
        id: s.id[0],
        locale: s.locale[0] as Locale,
    }));
}
