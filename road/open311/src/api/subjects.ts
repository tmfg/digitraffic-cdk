import type { Subject } from "../model/subject.js";
import { getXml } from "./xmlapiutils.js";
import { Locale } from "../model/locale.js";
import type { NonEmptyArray } from "../util-types.d.ts";

export async function getSubjects(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale
): Promise<Subject[]> {
    const parsedSubjects: SubjectsResponse = await getXml(
        endpointUser,
        endpointPass,
        endpointUrl,
        `/subjects?locale=${locale}`
    );
    return responseToSubjects(parsedSubjects).filter((s) => s.locale === locale); // integration returns mixed locales
}

interface SubjectsResponse {
    readonly subjects: SubjectResponseWrapper;
}

interface SubjectResponseWrapper {
    readonly subject: SubjectResponse[];
}

// properties deserialized as singleton arrays
interface SubjectResponse {
    readonly active: NonEmptyArray<number>;
    readonly name: NonEmptyArray<string>;
    readonly id: NonEmptyArray<number>;
    readonly locale: NonEmptyArray<string>;
}

function responseToSubjects(response: SubjectsResponse): Subject[] {
    return response.subjects.subject.map((s) => ({
        active: s.active[0],
        name: s.name[0],
        id: s.id[0],
        locale: s.locale[0] as Locale
    }));
}
