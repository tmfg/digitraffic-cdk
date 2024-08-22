import { formatInTimeZone } from "date-fns-tz";

/**
 * Constant for the 1970-01-01T00:00:00Z epoch Date.
 */
export const EPOCH = new Date(Date.UTC(1970, 0, 1));

export const UTC = "UTC";

export const MYSQL_DATETIME_FORMAT = "yyyy-MM-dd HH:mm";

/**
 * Counts difference in milliseconds between dates.
 * @param start
 * @param end
 */
export function countDiffMs(start: Date, end: Date): number {
    return end.getTime() - start.getTime();
}

/**
 * Counts difference in seconds between dates.
 * @param start
 * @param end
 */
export function countDiffInSeconds(start: Date, end: Date): number {
    return countDiffMs(start, end) / 1000;
}

/**
 * Converts ISO 8601 date-time -string to Date object
 * @param isoString to convert
 */
export function dateFromIsoString(isoString: string): Date {
    const parsed = new Date(isoString);
    if (!isValidDate(parsed)) {
        throw new Error(`Could not parse iso date-time string: "${isoString}" to date`);
    }
    return parsed;
}

function isValidDate(d: unknown) {
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Formats a date in UTC in the given format, regardless of system time zone
 */
export function dateToUTCString(date: Date, format: string): string {
    return formatInTimeZone(date, UTC, format);
}
