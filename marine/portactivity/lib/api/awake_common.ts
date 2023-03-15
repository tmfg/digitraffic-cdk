import {URN} from "@digitraffic/common/dist/types/urn";

export enum AwakeAiZoneType {
    VTS_AREA = "vts",
    PILOT_BOARDING_AREA = "pbp",
    PORT_AREA = "portarea",
    BERTH = "berth",
    ANCHORAGE = "anchorage",
}

export interface AwakeAiShip {
    readonly mmsi: number;
    readonly imo: number;
    readonly shipName?: string;
}

export enum AwakeAiPredictionType {
    ETA = "eta",
    ETD = "etd",
    TRAVEL_TIME = "travel-time",
    DESTINATION = "destination",
    ARRIVAL_PORT_CALL = "arrival-port-call",
}

export interface AwakeAiPredictionMetadata {
    source: AwakeURN | AwakeDigitrafficPortCallURN
}

type AwakeDigitrafficPortCallIDString = `digitraffic-portcall:${number}`;

export type AwakeURN<AwakeIDString extends string = string> = URN<"awake", AwakeIDString>;
export type AwakeDigitrafficPortCallURN = AwakeURN<AwakeDigitrafficPortCallIDString>;

/**
 * Base and mixin types
 */
export interface AwakeAiPrediction {
    readonly predictionType: AwakeAiPredictionType;
    readonly metadata?: AwakeAiPredictionMetadata
}

export interface AwakeAiZonePrediction extends AwakeAiPrediction {
    readonly zoneType: AwakeAiZoneType;
}

export interface AwakeAiLocodePrediction extends AwakeAiPrediction {
    // ISO 8601
    readonly recordTime?: string;

    // UN/LOCODE
    readonly locode: string;
}

/**
 * Actual prediction types
 */
export interface AwakeArrivalPortCallPrediction extends AwakeAiPrediction {
    // UUID
    readonly portCallId: string;

    // urn:awake:digitraffic-portcall:1234567890
    readonly portCallUrn: AwakeDigitrafficPortCallURN;

    // UN/LOCODE
    readonly portCallLocode: string;
}

export type AwakeAiDestinationPrediction = AwakeAiLocodePrediction;

export interface AwakeAiTravelTimePrediction
    extends AwakeAiLocodePrediction,
        AwakeAiZonePrediction {
    readonly zoneId: ["berth", "pbp"];

    readonly zoneName: string;

    // integer, in seconds
    readonly remainingTravelTime: number;
}

export interface AwakeAiVoyageEtaPrediction
    extends AwakeAiLocodePrediction,
        AwakeAiZonePrediction {
    // ISO 8601
    readonly arrivalTime: string;
}

export interface AwakeAiVoyageEtdPrediction
    extends AwakeAiLocodePrediction,
        AwakeAiZonePrediction {
    // ISO 8601
    readonly departureTime: string;
}

export enum AwakeAiShipStatus {
    UNDER_WAY = "underway",
    STOPPED = "stopped",
    NOT_STARTED = "not-started"
}

export interface AwakeAiPredictedVoyage {
    readonly voyageStatus: AwakeAiShipStatus;

    /**
     * Voyage sequence number, 0 for current voyage.
     */
    readonly sequenceNo: number;
    readonly predictions: AwakeAiPrediction[];
}
