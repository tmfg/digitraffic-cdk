import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
//import { validate, type ValuesQueryParameters } from "../../model/parameters.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { z, ZodError } from "zod";
import { findSiteDataForMonth } from "../../service/api-service.js";
import { AllTravelModes } from "../../model/v2/types.js";

const proxyHolder = ProxyHolder.create();

const GetCsvValuesSchema = z.object({
  year: z.coerce.number().refine((year) => year > 2023, "Year must be > 2023"),
  month: z.coerce.number().refine(
    (month) => month > 0 && month < 13,
    "Month must be between 1 and 12",
  ),
  siteId: z.coerce.number(),
  travelMode: z.enum(AllTravelModes).optional(),
}).strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getCsvValuesEvent = GetCsvValuesSchema.parse(event);
    const filename = `${getCsvValuesEvent.year}-${getCsvValuesEvent.month}.csv`;

    await proxyHolder.setCredentials();

    const [data, timestamp] = await findSiteDataForMonth(
      getCsvValuesEvent.year,
      getCsvValuesEvent.month,
      getCsvValuesEvent.siteId,
      getCsvValuesEvent.travelMode,
    );

    return LambdaResponse.ok(data, filename).withTimestamp(timestamp);
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponse.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetValuesCsv.handler",
      tookMs: Date.now() - start,
    });
  }
};
