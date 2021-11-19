export type PilotageRoute = {
    readonly start: {
        readonly code: string,
        readonly berth?: {
            readonly code: string,
        },
    },
    readonly end: {
        readonly code: string,
        readonly berth?: {
            readonly code: string,
        },
    },
}

export type Pilotage = {
    readonly id: number,
    readonly state: string,
    readonly vessel: {
        readonly name: string,
        readonly mmsi?: number,
        readonly imo?: number,
    },
    readonly route: PilotageRoute,
    readonly vesselEta: string,
    readonly pilotBoardingTime?: string,
    readonly endTime: string,
    readonly noticeGiven?: string,
    readonly scheduleSource: string,
    readonly scheduleUpdated: string,
    readonly portnetPortCallId?: number
}