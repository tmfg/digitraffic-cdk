export enum SubjectLocale {
    FINNISH = 'fi',
    SWEDISH = 'sv',
    ENGLISH = 'en'
}

export interface Subject {
    readonly active: number
    readonly name: string
    readonly id: number
    readonly locale: SubjectLocale
}
