import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { Context } from "aws-lambda";
import WebSocket from "ws";
import { AwakeAiATXApi } from "../../api/awake-ai-atx.js";
import { OAuthTokenApi } from "../../api/oauth-token-api.js";
import { PortactivityEnvKeys, PortactivitySecretKeys } from "../../keys.js";
import type { UpdateAwakeAiATXTimestampsSecret } from "../../model/secret.js";
import { AwakeAiATXService } from "../../service/awake-ai-atx.js";
import { sendMessage } from "../../service/queue-service.js";

const expectedKeys = [
  PortactivitySecretKeys.AWAKE_ATX_URL,
  PortactivitySecretKeys.AWAKE_OAUTH_TOKEN_ENDPOINT,
  PortactivitySecretKeys.AWAKE_OAUTH_CLIENT_ID,
  PortactivitySecretKeys.AWAKE_OAUTH_CLIENT_SECRET,
];

const rdsHolder: RdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<UpdateAwakeAiATXTimestampsSecret>(
  "awake",
  expectedKeys,
);

const sqsQueueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

/**
 * allow 10000 ms for SQS sends, this is a completely made up number
 */
const SQS_SEND_TIME = 10000;

export async function handler(__: unknown, context: Context): Promise<void> {
  await rdsHolder
    .setCredentials()
    .then(() => secretHolder.get())
    .then(async (secret: UpdateAwakeAiATXTimestampsSecret) => {
      const oAuthTokenApi = new OAuthTokenApi({
        oAuthTokenEndpoint: secret.oAuthTokenEndpoint,
        oAuthClientId: secret.oAuthClientId,
        oAuthClientSecret: secret.oAuthClientSecret,
      });
      const api = new AwakeAiATXApi(secret.atxurl, WebSocket);
      const service = new AwakeAiATXService(api, oAuthTokenApi);

      const timestamps = await service.getATXs(
        context.getRemainingTimeInMillis() - SQS_SEND_TIME,
      );
      logger.info({
        method: "UpdateAwakeAiAtxTimestamps.handler",
        customTimestampsReceivedCount: timestamps.length,
      });

      await Promise.allSettled(
        timestamps.map((ts) => sendMessage(ts, sqsQueueUrl)),
      );
    })
    .catch((error) => logException(logger, error));
}
