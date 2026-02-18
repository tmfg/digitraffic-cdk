import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { LambdaResponseBuilder } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import { getVisitsSchema } from "../../model/get-visits-schema.js";
import { VISIT_STATUS_QUERY_TO_VALUE_MAP } from "../../model/visit-schema.js";
import { getAllVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();

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
      return LambdaResponseBuilder.badRequest(
        JSON.stringify(z.flattenError(error).fieldErrors),
      );
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
