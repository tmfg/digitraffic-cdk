import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { PortactivityEnvKeys } from "../../keys.js";
import * as PilotwebService from "../../service/pilotweb.js";
import { sendMessage } from "../../service/queue-service.js";

const sqsQueueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

interface PilotWebSecret extends GenericSecret {
  readonly url: string;
  readonly auth: string;
}

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<PilotWebSecret>("pilotweb");

export const handler = (): Promise<void> =>
  rdsHolder
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
