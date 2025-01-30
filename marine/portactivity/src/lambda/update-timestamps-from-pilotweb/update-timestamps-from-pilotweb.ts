import { sendMessage } from "../../service/queue-service.js";
import * as PilotwebService from "../../service/pilotweb.js";
import { PortactivityEnvKeys } from "../../keys.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const sqsQueueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

interface PilotWebSecret extends GenericSecret {
  readonly url: string;
  readonly auth: string;
}

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<PilotWebSecret>("pilotweb");

export const handler = function (): Promise<void> {
  return rdsHolder
    .setCredentials()
    .then(() => secretHolder.get())
    .then(async (secret) => {
      const timestamps = await PilotwebService.getMessagesFromPilotweb(
        secret.url,
        secret.auth,
      );
      logger.info({
        method: "UpdatePilotwebTimestamps.handler",
        customTimestampsReceivedCount: timestamps.length,
      });

      await Promise.allSettled(
        timestamps.map((ts) => sendMessage(ts, sqsQueueUrl)),
      );
    })
    .catch((error) => {
      logException(logger, error);
    });
};
