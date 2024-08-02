// 0 == arrival, 1 == departure
export type TimeTableRowType = 0 | 1;

export interface UnknownDelayOrTrack {
    readonly stationShortCode: string
    readonly scheduledTime: Date
    readonly type: TimeTableRowType;    
    readonly delayUnknown: boolean
    readonly trackUnknown: boolean
}

export interface UnknownDelayOrTrackMessage {
    readonly messageId: string
    readonly trainNumber: number
    readonly departureDate: string // YYYYMMDD

    readonly data: UnknownDelayOrTrack[]
}
