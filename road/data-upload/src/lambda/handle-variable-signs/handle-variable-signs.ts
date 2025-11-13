import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { handleVariableSignMessages } from "../../service/variable-signs.js";

const proxyHolder = ProxyHolder.create();

const method = "HandleVariableSigns.handler" as const;

// this is triggered by SQS
export const handler = async (): Promise<void> => {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();
    await handleVariableSignMessages();
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
};
