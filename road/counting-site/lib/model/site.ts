import { ApiCounter } from "./counter";

export type ApiChannel = ApiCounter;

export interface ApiSite {
    readonly channels: ApiChannel[];
    readonly name: string;
}
