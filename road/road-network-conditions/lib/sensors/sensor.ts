
export interface Sensor {
    getData(from: number, to: number): SensorDataPoint[];
}

export type SensorDataPoint = {
    readonly device: string,
    readonly friction: number,
    readonly latitude: number,
    readonly longitude: number,
    readonly code: number,
    readonly state: string,
    readonly timestamp: number,
}
