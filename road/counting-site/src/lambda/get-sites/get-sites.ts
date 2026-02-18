import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { ZodError, z } from "zod";
import { getSites } from "../../service/api-service.js";

const proxyHolder = ProxyHolder.create();

const GetSitesSchema = z
  .object({
    siteId: z.coerce.number().optional(),
    domain: z.string().optional(),
  })
  .strict();

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    const getSitesEvent = GetSitesSchema.parse(event);

    await proxyHolder.setCredentials();

    const [featureCollection, lastModified] = await getSites(
      getSitesEvent.siteId,
      getSitesEvent.domain,
    );

    // give 404 only if siteId was set
    if (getSitesEvent.siteId && featureCollection.features.length === 0) {
      return LambdaResponse.notFound();
    }

    return LambdaResponse.okJson(featureCollection).withTimestamp(lastModified);
  } catch (error) {
    if (error instanceof ZodError) {
      return LambdaResponse.badRequest(JSON.stringify(error.issues));
    }

    logException(logger, error);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetSites.handler",
      tookMs: Date.now() - start,
    });
  }
};
