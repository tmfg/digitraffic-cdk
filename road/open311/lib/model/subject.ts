import {Locale} from './locale';

export interface Subject {
    readonly active: number
    readonly name: string
    readonly id: number
    readonly locale: Locale
}
