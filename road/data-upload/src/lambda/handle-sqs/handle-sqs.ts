import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { SQSEvent } from "aws-lambda";

const method = "HandleSqs.handler" as const;

// this is triggered by SQS from another account
export const handler = async (event: SQSEvent): Promise<void> => {
  const start = Date.now();

  try {
    logger.debug("Got message!");
    logger.debug(JSON.stringify(event.Records));
    //    await proxyHolder.setCredentials();
    //    await handleVariableSignMessages();
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
