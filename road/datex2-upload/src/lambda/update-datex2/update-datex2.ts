import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { updateDatex2 } from "../../service/datex2-update-service.js";

const proxyHolder = ProxyHolder.create();

const method = "UpdaterDatex2.handler" as const;

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  // eslint-disable-next-line dot-notation
  const datex2 = event["body"];
  const start = Date.now();

  if (datex2) {
    try {
      await proxyHolder.setCredentials();

      updateDatex2(datex2);
    } catch (error) {
      logger.error({
        method,
        error,
      });
    } finally {
      logger.info({
        method,
        tookMs: Date.now() - start,
      });
    }

    return LambdaResponse.ok("");
  }

  return LambdaResponse.badRequest("Missing body");
};
