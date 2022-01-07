import {ApiCounter} from "./counter";

export type ApiChannel = ApiCounter;

export type ApiSite = {
    readonly channels: ApiChannel[]
    readonly name: string
}
