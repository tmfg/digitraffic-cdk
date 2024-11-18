import type { Direction, Granularity, TravelMode } from "./types.js";

export interface ResponseValue {
    readonly siteId: number;
    readonly travelMode: TravelMode;
    readonly direction: Direction;
    readonly dataTimestamp: Date;
    readonly granularity: Granularity;
    readonly count: number;
}