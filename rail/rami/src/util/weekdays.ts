import { WEEKDAYS, WeekDay } from "../model/dt-rami-message";

export type BitString = `${"0" | "1"}`;
export type WeekDaysBitString =
    `${BitString}${BitString}${BitString}${BitString}${BitString}${BitString}${BitString}`;

export function mapDaysToBits(days: WeekDay[]): WeekDaysBitString {
    return WEEKDAYS.map((day) => (days.includes(day) ? "1" : "0")).join("") as WeekDaysBitString;
}

export function mapBitsToDays(days: WeekDaysBitString): WeekDay[] {
    const dayBits = days.split("");
    return WEEKDAYS.reduce<WeekDay[]>((acc, val, index) => {
        const i = parseInt(dayBits[index] as unknown as string);
        return i === 1 ? [...acc, val] : acc;
    }, []);
}
