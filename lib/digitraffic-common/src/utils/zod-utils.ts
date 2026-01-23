import { z } from "zod";

/**
 * Functions for validating and parsing e.g. path and query parameters with zod.
 * The value of the message parameter will appear in the zod error object resulting from failed validation.
 *
 * Usage:
 * const mySchema = z
 *  .object({
 *    myParameter: zStringToDate("Invalid value of myParameter").optional()
 *  });
 *
 */

export function zStringToNumber(message?: string) {
  return z
    .string()
    .transform(Number)
    .refine((number) => !Number.isNaN(number), {
      message: message ? message : "Not a number",
    });
}

export function zStringToDate(message?: string) {
  return z
    .string()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((date) => !date || !Number.isNaN(date.getTime()), {
      message: message ? message : "Invalid date format",
    });
}
