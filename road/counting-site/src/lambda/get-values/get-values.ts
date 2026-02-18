import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import { AllTravelModes } from "../../model/v2/types.js";
import { findSiteData } from "../../service/api-service.js";

const proxyHolder = ProxyHolder.create();

const GetValuesSchema = z
  .object({
    date: z.string().date().optional(),
    siteId: z.coerce.number().optional(),
    travelMode: z.enum(AllTravelModes).optional(),
  })
  .strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getValuesEvent = GetValuesSchema.parse(event);
    const dateAsDate = getValuesEvent.date
      ? new Date(getValuesEvent.date)
      : yesterday();
    await proxyHolder.setCredentials();

    const [data, lastModified] = await findSiteData(
      dateAsDate,
      getValuesEvent.siteId,
      getValuesEvent.travelMode,
    );

    return LambdaResponse.okJson(data).withTimestamp(lastModified);
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponse.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetValues.handler",
      tookMs: Date.now() - start,
    });
  }
};

function yesterday(): Date {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday;
}
