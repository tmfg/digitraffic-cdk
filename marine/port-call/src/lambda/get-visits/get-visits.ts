import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { LambdaResponseBuilder } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import { getAllVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();

const EmptyStringUndefined = z.literal("").transform(() => undefined);
const OptionalDateString = z.coerce.date().optional().or(EmptyStringUndefined);

const getVisitsSchema = z
  .object({
    from: OptionalDateString,
    to: OptionalDateString,
  })
  .strict()
  .readonly();

export type GetVisitsParameters = z.infer<typeof getVisitsSchema>;

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getVisitsEvent = getVisitsSchema.parse(event);

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
