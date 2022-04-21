import {SensorDataPoint} from "./sensor";

type Entry = {
    readonly ts: number,
    readonly value: string,
}

export type TeconerData = {
    readonly Friction: Entry[],
    readonly State: Entry[],
    readonly Latitude: Entry[],
    readonly Longitude: Entry[],
}

export function convertTeconer(device:string): (td: TeconerData) => SensorDataPoint[] {
    return (td: TeconerData) =>
        td.Friction.reduce((acc: SensorDataPoint[], val, index) => acc.concat({
            device,
            friction: parseFloat(td.Friction[index].value),
            latitude: parseFloat(td.Latitude[index].value),
            longitude: parseFloat(td.Longitude[index].value),
            code: parseInt(td.State[index].value, 10),
            state: "",
            timestamp: val.ts,
        }), []);
}
