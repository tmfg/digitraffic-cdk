export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export function validateYear(
  year: number,
  minYear: number = MIN_YEAR,
  maxYear: number = MAX_YEAR,
): boolean {
  return year >= minYear && year <= maxYear;
}

export function validateMonth(month: number): boolean {
  return month > 0 && month < 13;
}
