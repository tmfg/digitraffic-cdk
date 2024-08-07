export interface RtzPositionCoordinate {
    readonly $: {
        readonly lat: number;
        readonly lon: number;
    };
}

export interface RtzWaypointPosition {
    readonly position: RtzPositionCoordinate[];
}

export interface RtzWaypoint {
    readonly waypoint: RtzWaypointPosition[];
}

export interface RtzScheduleElement {
    readonly $: {
        /**
         * Date
         */
        readonly etd?: string;
        /**
         * Date
         */
        readonly eta?: string;
    };
}

export interface RtzSchedule {
    readonly scheduleElement: RtzScheduleElement[];
}

export interface RtzScheduleWrapper {
    readonly manual?: RtzSchedule[];
    readonly calculated?: RtzSchedule[];
}

export interface RtzSchedules {
    readonly schedule: RtzScheduleWrapper[];
}

export interface RtzRouteInfo {
    readonly $: {
        readonly vesselMMSI: string;
        readonly vesselIMO: string;
    };
}

export interface RtzRoute {
    readonly routeInfo: RtzRouteInfo[];
    readonly waypoints: RtzWaypoint[];
    readonly schedules: RtzSchedules[];
}

export interface RtzVoyagePlan {
    readonly route: RtzRoute;
}
