import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import { getLocation, getLocations } from "../../service/location-service.js";

const proxyHolder = ProxyHolder.create();

const GetLocationSchema = z
  .object({
    locode: z.string().optional(),
  })
  .strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getLocationEvent = GetLocationSchema.parse(event);
    await proxyHolder.setCredentials();

    // get single location
    if (getLocationEvent.locode) {
      const [location, lastUpdated] = await getLocation(
        getLocationEvent.locode,
      );

      if (!location) {
        return LambdaResponse.notFound();
      }

      return lastUpdated
        ? LambdaResponse.okJson(location).withTimestamp(lastUpdated)
        : LambdaResponse.okJson(location);
    }

    // get all locations
    const [locations, lastUpdated] = await getLocations();

    return lastUpdated
      ? LambdaResponse.okJson(locations).withTimestamp(lastUpdated)
      : LambdaResponse.okJson(locations);
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponse.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error, true);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetLocations.handler",
      tookMs: Date.now() - start,
    });
  }
};
