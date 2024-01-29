import type { ApiCounter } from "./counter.js";

export type ApiChannel = ApiCounter;

export interface ApiSite {
    readonly channels: ApiChannel[];
    readonly name: string;
}
