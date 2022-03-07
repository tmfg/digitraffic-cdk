
export interface Sensor {
    getData(from: number, to: number): SensorDataPoint[];
}

export type SensorDataPoint = {
    device: string,
    friction: number,
    latitude: number,
    longitude: number,
    code: number,
    state: string,
    timestamp: number,
}
