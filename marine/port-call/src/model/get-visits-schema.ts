import {
  zNonEmptyString,
  zStringToDate,
  zStringToNumber,
} from "@digitraffic/common/dist/utils/zod-utils";
import { z } from "zod";
import type { VisitSort, VisitStatus } from "./visit-schema.js";
import {
  SORT_DIRECTIONS,
  VISIT_SORT_FIELDS,
  VISIT_STATUS_QUERY_VALUES,
} from "./visit-schema.js";

const zStatus = () =>
  z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(z.enum(VISIT_STATUS_QUERY_VALUES));

const zSort = () =>
  z.string().transform((val, ctx) => {
    const parts = val.split(":");
    if (parts.length !== 2) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid sort format: ${val}. Expected format: field:direction`,
      });
      return z.NEVER;
    }
    const [field, direction] = parts;
    if (
      !VISIT_SORT_FIELDS.includes(field as (typeof VISIT_SORT_FIELDS)[number])
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid sort field: ${field}. Allowed: ${VISIT_SORT_FIELDS.join(", ")}`,
      });
      return z.NEVER;
    }
    if (
      !SORT_DIRECTIONS.includes(direction as (typeof SORT_DIRECTIONS)[number])
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid sort direction: ${direction}. Allowed: ${SORT_DIRECTIONS.join(", ")}`,
      });
      return z.NEVER;
    }
    return {
      field: field as (typeof VISIT_SORT_FIELDS)[number],
      direction: direction as (typeof SORT_DIRECTIONS)[number],
    };
  });

export const getVisitsSchema = z
  .object({
    fromDateTime: zStringToDate().optional(),
    toDateTime: zStringToDate().optional(),
    portOfCall: zNonEmptyString().optional(),
    vesselName: zNonEmptyString().optional(),
    imo: zStringToNumber().optional(),
    status: zStatus().optional(),
    sort: zSort().optional(),
  })
  .strict()
  .readonly();

export type GetVisitsParameters = Omit<
  z.infer<typeof getVisitsSchema>,
  "status" | "sort"
> & {
  status?: VisitStatus;
  sort?: VisitSort;
};
