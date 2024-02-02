import type { Locale } from "./locale.js";

export interface ServiceRequestState {
    readonly key: number;
    readonly name: string;
    readonly locale: Locale;
}
