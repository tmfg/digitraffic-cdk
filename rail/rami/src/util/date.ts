import { format, utcToZonedTime } from "date-fns-tz";

export function formatInTimeZone(date: Date, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
}
