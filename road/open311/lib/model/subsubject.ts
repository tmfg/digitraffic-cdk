import {SubjectLocale} from "./subject";

export interface SubSubject {
    readonly active: number
    readonly name: string
    readonly id: number
    readonly locale: SubjectLocale
    readonly subject_id: number;
}
