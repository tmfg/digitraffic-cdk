export enum EventType {
    ETA = 'ETA',
    ATB = 'ATB',
    ETD = 'ETD'
}

export interface Ship {
    readonly mmsi?: number
    readonly imo?: number
}

export interface Location {
    readonly port: string
    readonly terminal?: string
    readonly berth?: string
    readonly berthPosition?: string
    readonly shipSide?: string
}

export interface ApiEstimate {
    readonly eventType: EventType
    readonly eventTime: string
    readonly eventTimeConfidenceLower?: string | null
    readonly eventTimeConfidenceUpper?: string | null
    readonly recordTime: string
    readonly source: string
    readonly ship: Ship
    readonly location: Location
}
