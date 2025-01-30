import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getLocation, getLocations } from "../../service/location-service.js";
import { z, ZodError } from "zod";

const proxyHolder = ProxyHolder.create();

const GetLocationSchema = z.object({
  "location-id": z.string().optional(),
}).strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getLocationEvent = GetLocationSchema.parse(event);
    await proxyHolder.setCredentials();

    // get single location
    if (getLocationEvent["location-id"]) {
      const [location, lastUpdated] = await getLocation(
        getLocationEvent["location-id"],
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
