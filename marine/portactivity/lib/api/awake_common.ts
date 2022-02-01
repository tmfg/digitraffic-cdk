export enum AwakeAiZoneType {
    VTS_AREA = 'vts',
    PILOT_BOARDING_AREA = 'pbp',
    PORT_AREA = 'portarea',
    BERTH = 'berth',
    ANCHORAGE = 'anchorage'
}

export type AwakeAiShip = {
    readonly mmsi: number
    readonly imo?: number
    readonly shipName?: string,
}

export enum AwakeAiPredictionType {
    ETA = 'eta',
    TRAVEL_TIME = 'travel-time',
    DESTINATION = 'destination'
}

export type AwakeAiPrediction = {

    readonly predictionType: AwakeAiPredictionType

    // ISO 8601
    readonly recordTime: string

    readonly locode: string

    readonly zoneType: AwakeAiZoneType
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
