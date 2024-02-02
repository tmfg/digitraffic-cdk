import { Locale } from "../model/locale.js";
import type { SubSubject } from "../model/subsubject.js";
import { getXml } from "./xmlapiutils.js";
import type { NonEmptyArray } from "../util-types.d.ts";

export async function getSubSubjects(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: Locale
): Promise<SubSubject[]> {
    const parsedSubSubjects: SubSubjectsResponse = await getXml(
        endpointUser,
        endpointPass,
        endpointUrl,
        `/subsubjects?locale=${locale}`
    );
    return responseToSubjects(parsedSubSubjects).filter((s) => s.locale === locale); // integration returns mixed locales
}

interface SubSubjectsResponse {
    readonly subsubjects: SubSubjectResponseWrapper;
}

interface SubSubjectResponseWrapper {
    readonly subsubject: SubSubjectResponse[];
}

// properties deserialized as singleton arrays
interface SubSubjectResponse {
    readonly active: NonEmptyArray<number>;
    readonly name: NonEmptyArray<string>;
    readonly id: NonEmptyArray<number>;
    readonly locale: NonEmptyArray<string>;
    readonly subject_id: NonEmptyArray<number>;
}

function responseToSubjects(response: SubSubjectsResponse): SubSubject[] {
    return response.subsubjects.subsubject.map((s) => ({
        active: s.active[0],
        name: s.name[0],
        id: s.id[0],
        locale: s.locale[0] as Locale,
        subject_id: s.subject_id[0]
    }));
}
