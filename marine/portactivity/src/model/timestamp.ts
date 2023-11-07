import type { NullableOptional } from "@digitraffic/common/dist/types/nullable";

export enum EventType {
    ATA = "ATA",
    ATB = "ATB",
    ATD = "ATD",
    ETA = "ETA",
    ETB = "ETB",
    ETP = "ETP",
    ETD = "ETD",
    // for pilotage
    RPS = "RPS",
    PPS = "PPS",
    APS = "APS",
    APC = "APC"
}

export interface Ship {
    readonly mmsi?: number;
    readonly imo: number;
}

export interface Location {
    readonly port: string;
    readonly portArea?: string;
    readonly from?: string;
    readonly terminal?: string;
    readonly berth?: string;
    readonly berthPosition?: string;
    readonly shipSide?: string;
}

export interface ApiTimestamp {
    readonly eventType: EventType;
    readonly eventTime: string;
    readonly recordTime: string;
    readonly source: string;
    readonly ship: Ship;
    readonly location: Location;
    readonly eventTimeConfidenceLowerDiff?: number;
    readonly eventTimeConfidenceUpperDiff?: number;
    readonly portcallId?: number;
    readonly sourceId?: string;
}

export type PublicApiTimestamp = NullableOptional<
    Omit<ApiTimestamp, "ship" | "location"> & {
        ship: NullableOptional<Ship>;
        location: NullableOptional<Location>;
    }
>;
