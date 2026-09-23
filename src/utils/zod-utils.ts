import { z } from "zod";

/**
 * Functions for validating and parsing e.g. path and query parameters with zod.
 * The value of the message parameter will appear in the zod error object resulting from failed validation.
 * Empty strings are treated as undefined.
 *
 * Usage:
 * const mySchema = z
 *  .object({
 *    requiredParam: zStringToDate("Invalid value of myParameter"),
 *    optionalParam: zStringToDate().optional(),
 *  });
 *
 */

/**
 * Parses a string to a number. Empty strings are treated as undefined.
 */
export function zStringToNumber(message?: string) {
  return z.string().transform((val, ctx) => {
    if (!val) return undefined;
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({ code: "custom", message: message ?? "Not a number" });
      return z.NEVER;
    }
    return num;
  });
}

/**
 * Parses a string to a Date. Empty strings are treated as undefined.
 */
export function zStringToDate(message?: string) {
  return z.string().transform((val, ctx) => {
    if (!val) return undefined;
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: message ?? "Invalid date format",
      });
      return z.NEVER;
    }
    return date;
  });
}

/**
 * A non-empty string. Empty strings produce a validation error.
 * Chain with .optional() to also accept undefined.
 */
export function zNonEmptyString(message?: string) {
  return z.string().refine((val) => val !== "", {
    message: message ?? "String must not be empty",
  });
}
