export type RtzPositionCoordinate = {
    readonly $: {
        readonly lat: number
        readonly lon: number
    }
}

export type RtzWaypointPosition = {
    readonly position: RtzPositionCoordinate[]
}

export type RtzWaypoint = {
    readonly waypoint: RtzWaypointPosition[]
}

export type RtzScheduleElement = {
    readonly $: {
        /**
         * Date
         */
        readonly etd?: string
        /**
         * Date
         */
        readonly eta?: string
    },
}

export type RtzSchedule = {
    readonly scheduleElement: RtzScheduleElement[]
}

export type RtzScheduleWrapper = {
    readonly manual?: RtzSchedule[]
    readonly calculated?: RtzSchedule[]
}

export type RtzSchedules = {
    readonly schedule: RtzScheduleWrapper[]
}

export type RtzRoute = {
    readonly waypoints: RtzWaypoint[]
    readonly schedules: RtzSchedules[]
}

export type RtzVoyagePlan = {
    readonly route: RtzRoute
}
