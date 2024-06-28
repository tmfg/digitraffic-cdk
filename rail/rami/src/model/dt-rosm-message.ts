// 0 == arrival, 1 == departure
export type TimeTableRowType = 0 | 1;

export interface StMonitoringData {
    readonly stationShortCode: string
    readonly scheduledTime: Date
    readonly type: TimeTableRowType;    
    readonly timeUnknown: boolean
    readonly quayUnknown: boolean
}

export interface DtSmMessage {
    readonly trainNumber: number
    readonly departureDate: string // YYYYMMDD

    readonly data: StMonitoringData[]
}
