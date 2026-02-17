import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { decodeBase64ToAscii } from "@digitraffic/common/dist/utils/base64";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { PortCallSecret } from "../../model/secret.js";
import { updateVisits } from "../../service/visit-service.js";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<PortCallSecret>("port-call");

export const handler = async (): Promise<void> => {
  const start = Date.now();

  try {
    await proxyHolder.setCredentials();
    const secret = await secretHolder.get();

    await updateVisits(
      secret.url,
      decodeBase64ToAscii(secret.privateKey),
      decodeBase64ToAscii(secret.certificate),
    );
  } catch (error) {
    logException(logger, error, true);
  } finally {
    logger.info({
      method: "UpdateVisits.handler",
      tookMs: Date.now() - start,
    });
  }
};
