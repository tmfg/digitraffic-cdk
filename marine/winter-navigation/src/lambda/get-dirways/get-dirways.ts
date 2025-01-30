import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getDirways } from "../../service/dirway-service.js";

const proxyHolder = ProxyHolder.create();

export const handler = async (
  _event: Record<string, string>,
): Promise<LambdaResponse> => {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();

    // get all dirways
    const [dirways, lastUpdated] = await getDirways();

    return lastUpdated
      ? LambdaResponse.okJson(dirways).withTimestamp(lastUpdated)
      : LambdaResponse.okJson(dirways);
  } catch (error) {
    logException(logger, error, true);

    return LambdaResponse.internalError();
  } finally {
    logger.info({
      method: "GetDirways.handler",
      tookMs: Date.now() - start,
    });
  }
};
