import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import * as UpdateService from "../../service/update.js";
import type { PermitsSecret } from "../../model/permits-secret.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

// eslint-disable-next-line dot-notation
const PERMIT_DOMAIN = process.env["PERMIT_DOMAIN"];
const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<PermitsSecret>("ep." + PERMIT_DOMAIN);

export const handler = async () => {
  const start = Date.now();

  return proxyHolder
    .setCredentials()
    .then(async () => {
      const secret = await secretHolder.get();
      await UpdateService.updatePermits(secret.authKey, secret.url);
    })
    .finally(() => {
      logger.info({
        method: "update-permits.handler",
        message: `permit domain: ${PERMIT_DOMAIN}`,
        tookMs: Date.now() - start,
      });
    });
};
