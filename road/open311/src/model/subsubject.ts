import type { Locale } from "./locale.js";

export interface SubSubject {
    readonly active: number;
    readonly name: string;
    readonly id: number;
    readonly locale: Locale;
    readonly subject_id: number;
}

export interface DigitrafficApiSubSubject {
    readonly active: number;
    readonly name: string;
    readonly id: number;
    readonly locale: Locale;
    readonly subjectId: number;
}
