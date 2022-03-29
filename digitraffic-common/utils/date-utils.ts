
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
    return countDiffMs(start, end)/1000;
}

/**
 * Converts ISO 8601 date-time -string to Date object
 * @param isoString to convert
 */
export function dateFromIsoString(isoString: string): Date {
    const parsed = new Date(isoString);
    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
        throw new Error(`Invalid ISO-DATE -string: ${isoString}`);
    }
    return parsed;
}
