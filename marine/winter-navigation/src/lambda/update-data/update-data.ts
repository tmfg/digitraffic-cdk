import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { DataUpdater } from "../../service/data-updater.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const proxyHolder = ProxyHolder.create();

const baseUrl = "TODO";
const authHeaderValue = "TODO";

export async function handler(): Promise<void> {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();

    const updater = new DataUpdater(baseUrl, authHeaderValue);
    await updater.update();
  } finally {
    logger.info({
      method: "UpdateData.handler",
      tookMs: Date.now() - start,
    });
  }
}
