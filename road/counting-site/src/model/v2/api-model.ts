import type { Direction, Granularity, TravelMode } from "./types.js";

export interface ApiSite {
    readonly id: number;
    readonly name: string;
    readonly description: string;
    readonly customId: string;
    readonly location: {
        readonly lat: number;
        readonly lon: number;
    };
    readonly granularity: Granularity;
    readonly travelModes: TravelMode[];
    readonly directional: boolean;
}

export interface ApiDataPoint {
    readonly timestamp: Date;
    readonly granularity: Granularity;
    readonly counts: number;
}

export interface ApiData {
    readonly travelMode: TravelMode;
    readonly direction: Direction;
    readonly data: ApiDataPoint[];
}