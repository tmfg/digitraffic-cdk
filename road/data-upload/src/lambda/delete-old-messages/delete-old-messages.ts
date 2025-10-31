import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { deleteOldMessages } from "../../service/datex2-update.js";

const proxyHolder = ProxyHolder.create();

const method = "DeleteOldMessages.handler" as const;

export async function handler(): Promise<void> {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();

    await deleteOldMessages();
  } catch (error) {
    logger.error({ method, error });
  } finally {
    logger.info({
      method,
      tookMs: Date.now() - start,
    });
  }
}
