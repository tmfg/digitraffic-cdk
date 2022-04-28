export enum AwakeAiZoneType {
    VTS_AREA = 'vts',
    PILOT_BOARDING_AREA = 'pbp',
    PORT_AREA = 'portarea',
    BERTH = 'berth',
    ANCHORAGE = 'anchorage'
}

export type AwakeAiShip = {
    readonly mmsi: number
    readonly imo: number
    readonly shipName?: string,
}

export enum AwakeAiPredictionType {
    ETA = 'eta',
    TRAVEL_TIME = 'travel-time',
    DESTINATION = 'destination',
    ARRIVAL_PORT_CALL = 'arrival-port-call',
}

/**
 * Base and mixin types
 */
export type AwakeAiPrediction = {
    readonly predictionType: AwakeAiPredictionType
}

export type AwakeAiZonePrediction = AwakeAiPrediction & {
    readonly zoneType: AwakeAiZoneType
}

export type AwakeAiLocodePrediction = AwakeAiPrediction & {
    // ISO 8601
    readonly recordTime: string

    // UN/LOCODE
    readonly locode: string
}

/**
 * Actual prediction types
 */
export type AwakeArrivalPortCallPrediction = AwakeAiPrediction & {
    // UUID
    readonly portCallId: string

    // urn:awake:digitraffic-portcall:1234567890
    readonly portCallUrn: string

    // UN/LOCODE
    readonly portCallLocode: string
}

export type AwakeAiDestinationPrediction = AwakeAiLocodePrediction

export type AwakeAiTravelTimePrediction = AwakeAiLocodePrediction & AwakeAiZonePrediction & {
    readonly zoneId: ['berth', 'pbp']

    readonly zoneName: string

    // integer, in seconds
    readonly remainingTravelTime: number
}

export type AwakeAiVoyageEtaPrediction = AwakeAiLocodePrediction & AwakeAiZonePrediction & {
    // ISO 8601
    readonly arrivalTime: string
}

export enum AwakeAiShipStatus {
    UNDER_WAY = 'underway',
    STOPPED = 'stopped',
    NOT_PREDICTABLE = 'not_predictable',
    VESSEL_DATA_NOT_UPDATED = 'vessel_data_not_updated'
}

export type AwakeAiPredictedVoyage = {

    readonly voyageStatus: AwakeAiShipStatus

    /**
     * Voyage sequence number, 0 for current voyage.
     */
    readonly sequenceNo: number

    readonly predictions: AwakeAiPrediction[]
}
