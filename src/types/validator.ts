export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export function validateYear(year: number, minYear = MIN_YEAR, maxYear = MAX_YEAR) {
    return year >= minYear && year <= maxYear;
}

export function validateMonth(month: number) {
    return month > 0 && month < 13;
}
