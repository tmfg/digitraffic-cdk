import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getVisit } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();
interface GetVisitEvent {
  readonly visitId: string;
}

export const handler = async (
  event: GetVisitEvent,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();
    const [visit, lastUpdated] = await getVisit(event.visitId);

    if (!visit) {
      return LambdaResponse.notFound();
    }

    return lastUpdated
      ? LambdaResponse.okJson(visit).withTimestamp(lastUpdated)
      : LambdaResponse.okJson(visit);
  } catch (error) {
    logException(logger, error, true);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetVisit.handler",
      tookMs: Date.now() - start,
    });
  }
};
