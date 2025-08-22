import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getVessel, getVessels } from "../../service/vessel-service.js";
import { z, ZodError } from "zod";

const proxyHolder = ProxyHolder.create();

const GetVesselSchema = z.object({
  "vessel-id": z.string().optional(),
}).strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getVesselEvent = GetVesselSchema.parse(event);
    await proxyHolder.setCredentials();

    // get single vessel
    if (getVesselEvent["vessel-id"]) {
      const [vessel, lastUpdated] = await getVessel(
        getVesselEvent["vessel-id"],
      );

      if (!vessel) {
        return LambdaResponse.notFound();
      }

      return lastUpdated
        ? LambdaResponse.okJson(vessel).withTimestamp(lastUpdated)
        : LambdaResponse.okJson(vessel);
    }

    // get all vessels
    const [vessels, lastUpdated] = await getVessels();

    return lastUpdated
      ? LambdaResponse.okJson(vessels).withTimestamp(lastUpdated)
      : LambdaResponse.okJson(vessels);
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponse.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error, true);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetVessels.handler",
      tookMs: Date.now() - start,
    });
  }
};
