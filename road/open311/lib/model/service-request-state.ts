import {Locale} from "./locale";

export interface ServiceRequestState {
    readonly key: number
    readonly name: string
    readonly locale: Locale
}