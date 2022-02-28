export type ApiDevice = {
    readonly id: string,
    readonly description: string,
    readonly ioChannels: ApiIoChannel[],
}

export type ApiIoChannel = {
    readonly id: number,
    readonly enabled: boolean
    readonly name: string
}

export type ApiWorkeventDevice = {
    readonly deviceId: bigint,
    readonly deviceName: string,
    readonly workEvents: ApiWorkevent[]
}

export type ApiWorkevent = {
    readonly deviceId: bigint
    readonly timest: string
    readonly deviceName: string
    readonly altitude: bigint
    readonly heading: number
    readonly ioChannels: ApiWorkeventIoDevice[]
    readonly lat: number
    readonly lon: number
    readonly speed: bigint
    timestamp: Date
}

export type ApiWorkeventIoDevice = {
    readonly id: number,
    readonly name: string
}