export interface RtzPositionCoordinate {
    readonly $: {
        readonly lat: number
        readonly lon: number
    }
}

export interface RtzWaypointPosition {
    readonly position: RtzPositionCoordinate[]
}

export interface RtzWaypoint {
    readonly waypoint: RtzWaypointPosition[]
}

export interface RtzRoute {
    readonly waypoints: RtzWaypoint[]
}

export interface RtzVoyagePlan {
    readonly route: RtzRoute
}
