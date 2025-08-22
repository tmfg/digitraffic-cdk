import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { DataUpdater } from "../../service/data-updater.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

interface IbnetSecret extends GenericSecret {
  readonly url: string
  readonly authHeaderValue: string;
}

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<IbnetSecret>("ibnet");

export async function handler(): Promise<void> {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();
    const secret = await secretHolder.get();

    const updater = new DataUpdater(secret.url, secret.authHeaderValue);
    await updater.update();
  } finally {
    logger.info({
      method: "UpdateData.handler",
      tookMs: Date.now() - start,
    });
  }
}
