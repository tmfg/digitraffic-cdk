import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getVessel, getVessels } from "../../service/vessel-service.js";
import { z, ZodError } from "zod";

const proxyHolder = ProxyHolder.create();

// the total payload size limit is 6291556 bytes, but there will be other data in the payload in addition to the body
const MAX_PAYLOAD_BODY_SIZE_BYTES = 4.5 * 1024 * 1024;

const GetVesselSchema = z.object({
  // path parameter
  "vesselId": z.string().transform(Number).optional(),
  // query parameters absent from original request appear as empty strings in Lambda event
  "activeFrom": z.string().transform((val) => val ? new Date(val) : undefined)
    .optional(),
  "activeTo": z.string().transform((val) => val ? new Date(val) : undefined)
    .optional(),
}).strict();

export type GetVesselEvent = z.input<typeof GetVesselSchema>;

export const handler = async (
  event: GetVesselEvent,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getVesselEvent = GetVesselSchema.parse(event);
    await proxyHolder.setCredentials();

    // get single vessel
    if (getVesselEvent.vesselId) {
      const [vessel, lastUpdated] = await getVessel(
        getVesselEvent.vesselId,
        getVesselEvent.activeFrom,
        getVesselEvent.activeTo,
      );

      if (!vessel) {
        return LambdaResponse.notFound();
      }

      return lastUpdated
        ? LambdaResponse.okJson(vessel).withTimestamp(lastUpdated)
        : LambdaResponse.okJson(vessel);
    }

    // get all vessels
    const [vessels, lastUpdated] = await getVessels(
      getVesselEvent.activeFrom,
      getVesselEvent.activeTo,
    );

    const responseBody = JSON.stringify(vessels);
    const payloadSizeBytes = Buffer.from(responseBody).length;

    if (payloadSizeBytes > MAX_PAYLOAD_BODY_SIZE_BYTES) {
      logger.warn({
        method: "GetVessels.handler",
        message:
          `Response payload is too large with parameters ${getVesselEvent.activeFrom?.toISOString()} and ${getVesselEvent.activeTo?.toISOString()}`,
        customBytes: payloadSizeBytes,
        customLimit: MAX_PAYLOAD_BODY_SIZE_BYTES,
      });
      return LambdaResponse.contentTooLarge(
        "Response too large. Please use query parameters to limit the size.",
      );
    }

    return lastUpdated
      ? LambdaResponse.okJson(vessels).withTimestamp(lastUpdated)
      : LambdaResponse.okJson(vessels);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({
        method: "GetVessels.handler",
        message: JSON.stringify(error.issues),
      });
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
