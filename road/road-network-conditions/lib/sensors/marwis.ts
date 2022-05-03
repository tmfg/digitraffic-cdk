import {SensorDataPoint} from "./sensor";

type Entry = {
    readonly ts: number,
    readonly value: string,
}

export type MarwisData = {
    readonly Friction: Entry[],
    readonly Road_Condition: Entry[],
    readonly lat: Entry[],
    readonly lon: Entry[],
}

export function convertMarwis(device: string): (td: MarwisData) => SensorDataPoint[] {
    return (td: MarwisData) =>
        td.Friction.reduce((acc: SensorDataPoint[], val, index) => acc.concat({
            device,
            friction: parseFloat(td.Friction[index].value),
            latitude: parseFloat(td.lat[index].value),
            longitude: parseFloat(td.lon[index].value),
            code: parseInt(td.Road_Condition[index].value, 10),
            state: "",
            timestamp: val.ts,
        }), []);
}
