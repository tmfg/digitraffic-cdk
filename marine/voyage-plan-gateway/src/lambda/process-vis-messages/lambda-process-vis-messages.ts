import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { VoyagePlanEnvKeys, VoyagePlanSecretKeys } from "../../keys.js";
import * as VisApi from "../../api/vis.js";
import { VisMessageType } from "../../api/vis.js";
import type { VisMessageWithCallbackEndpoint } from "../../model/vismessage.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { gzipSync } from "zlib";
import { createHash } from "crypto";

interface VoyagePlanSecret extends GenericSecret {
  [VoyagePlanSecretKeys.PRIVATE_VIS_URL]: string;
  [VoyagePlanSecretKeys.APP_ID]: string;
  [VoyagePlanSecretKeys.API_KEY]: string;
}

const secretHolder = SecretHolder.create<VoyagePlanSecret>();
const queueUrl = getEnvVariable(VoyagePlanEnvKeys.QUEUE_URL);

const MessageGroupId = "VPGW-MessageGroupId" as const;

const sqs = new SQSClient();

export function handler(): Promise<void> {
  return secretHolder.get().then(async (secret: VoyagePlanSecret) => {
    const privateVisUrl = secret[VoyagePlanSecretKeys.PRIVATE_VIS_URL];
    const appId = secret[VoyagePlanSecretKeys.APP_ID];
    const apiKey = secret[VoyagePlanSecretKeys.API_KEY];

    const messages = await VisApi.getMessages(privateVisUrl, appId, apiKey);

    const routeMessages = messages.message.filter((msg) =>
      msg.messageType === VisMessageType.RTZ
    );
    // Do these contain failed authentications?
    const txtMessages = messages.message.filter((msg) =>
      msg.messageType === VisMessageType.TXT
    );

    logger.info({
      method: "vpgwProcessVisMessages.handler",
      customCount: messages.message.length,
    });

    if (messages.remainingNumberOfMessages > 50) {
      logger.warn({
        method: "vpgwProcessVisMessages.handler",
        message: "More than 50 messages remain in queue",
        customCount: messages.remainingNumberOfMessages,
      });
    }

    txtMessages.forEach((msg) =>
      logger.info({
        method: "vpgwProcessVisMessages.handler",
        message: `Received TXT message: ${msg.id}`,
      })
    );

    for (const routeMessage of routeMessages) {
      logger.info({
        method: "vpgwProcessVisMessages.handler",
        message: `Processing RTZ message: ${routeMessage.stmMessage.message}`,
      });

      const message: VisMessageWithCallbackEndpoint = {
        callbackEndpoint: routeMessage.CallbackEndpoint,
        message: routeMessage.stmMessage.message,
      };
      // gzip data to avoid SQS 256 KB limit
      const gzippedMessage: Buffer = gzipSync(
        Buffer.from(JSON.stringify(message), "utf-8"),
      );
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          // SQS only allows character data so the message must also be base64 encoded
          MessageBody: gzippedMessage.toString("base64"),
          MessageGroupId,
          MessageDeduplicationId: createRtzHash(
            routeMessage.stmMessage.message,
          ),
        }),
      );
    }
  });
}

function createRtzHash(rtz: string): string {
  return createHash("sha256").update(rtz).digest("hex");
}
