export interface AreaTrafficShip {
    readonly name: string;
    readonly mmsi: number;
}

export interface AreaTraffic {
    readonly areaId: number;
    readonly durationInMinutes: number;
    readonly visibilityInMeters: number | undefined;
    readonly ship: AreaTrafficShip;
}
