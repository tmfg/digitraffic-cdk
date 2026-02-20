import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";
import {
  fetchRemoteDisruptions,
  saveDisruptions,
} from "../../service/disruptions.js";

const proxyHolder = ProxyHolder.create();
const secretHolder = SecretHolder.create<DisturbancesSecret>(
  "waterwaydisturbances",
);

interface DisturbancesSecret extends GenericSecret {
  url: string;
}

export const handler = (): Promise<void> => {
  return proxyHolder
    .setCredentials()
    .then(() => secretHolder.get())
    .then((secret) => fetchRemoteDisruptions(secret.url))
    .then((disruptions) => saveDisruptions(disruptions))
    .catch((error: Error) => {
      logException(logger, error, true);
    });
};
