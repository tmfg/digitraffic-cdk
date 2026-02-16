import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { LambdaResponseBuilder } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import type { VisitSort, VisitStatus } from "../../model/visit-schema.js";
import {
  SORT_DIRECTIONS,
  VISIT_SORT_FIELDS,
  VISIT_STATUS_QUERY_TO_VALUE_MAP,
  VISIT_STATUS_QUERY_VALUES,
} from "../../model/visit-schema.js";
import { getAllVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();

const EmptyStringUndefined = z.literal("").transform(() => undefined);
const OptionalDateString = z.coerce.date().optional().or(EmptyStringUndefined);
const OptionalString = z.string().optional();
const OptionalNumber = z.coerce.number().optional().or(EmptyStringUndefined);
const OptionalStatus = z.enum(VISIT_STATUS_QUERY_VALUES).optional();
const OptionalSort = z
  .string()
  .optional()
  .or(EmptyStringUndefined)
  .transform((val, ctx) => {
    if (!val) return undefined;
    const parts = val.split(":");
    if (parts.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid sort format: ${val}. Expected format: field:direction`,
      });
      return z.NEVER;
    }
    const [field, direction] = parts;
    if (
      !VISIT_SORT_FIELDS.includes(field as (typeof VISIT_SORT_FIELDS)[number])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid sort field: ${field}. Allowed: ${VISIT_SORT_FIELDS.join(", ")}`,
      });
      return z.NEVER;
    }
    if (
      !SORT_DIRECTIONS.includes(direction as (typeof SORT_DIRECTIONS)[number])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid sort direction: ${direction}. Allowed: ${SORT_DIRECTIONS.join(", ")}`,
      });
      return z.NEVER;
    }
    return {
      field: field as (typeof VISIT_SORT_FIELDS)[number],
      direction: direction as (typeof SORT_DIRECTIONS)[number],
    };
  });

const getVisitsSchema = z
  .object({
    fromDateTime: OptionalDateString,
    toDateTime: OptionalDateString,
    portOfCall: OptionalString,
    vesselName: OptionalString,
    imo: OptionalNumber,
    status: OptionalStatus,
    sort: OptionalSort,
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

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const parsed = getVisitsSchema.parse(event);
    const getVisitsEvent = {
      ...parsed,
      status: parsed.status
        ? VISIT_STATUS_QUERY_TO_VALUE_MAP[parsed.status]
        : undefined,
      portOfCall: parsed.portOfCall?.toUpperCase(),
    };

    return proxyHolder
      .setCredentials()
      .then(() => getAllVisits(getVisitsEvent))
      .then(([visits, lastUpdated]) => {
        return lastUpdated
          ? LambdaResponseBuilder.create(visits)
              .withTimestamp(lastUpdated)
              .build()
          : LambdaResponseBuilder.create(visits).build();
      });
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponseBuilder.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error, true);

    return LambdaResponseBuilder.internalError();
  } finally {
    logger.info({
      method: "GetVisits.handler",
      tookMs: Date.now() - start,
    });
  }
};
