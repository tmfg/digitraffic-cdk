import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { SNSMessage, SQSEvent } from "aws-lambda";
import { messageSchema, type UpdateObject } from "../../model/sqs-message-schema.js";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { updateRtti } from "../../service/datex2-update.js";

const method = "HandleRtti.handler" as const;

const proxyHolder = ProxyHolder.create();

export const handler = async (event: SQSEvent): Promise<void> => {
  const start = Date.now();

  await proxyHolder.setCredentials();

  try {
    await Promise.all(event.Records.map(async (record) => {
      const { messageId, body } = record;

      const parsedMessage = parsePayload(body);

      logger.debug(`Parsed message ${messageId}: ` + JSON.stringify(parsedMessage));

      await updateRtti(parsedMessage);
    }));
  } catch (error) {
    logger.debug("Error handling message:" + JSON.stringify(event));
    logger.error({
      method,
      error,
    });
  } finally {
    logger.info({
      method,
      tookMs: Date.now() - start,
    });
  }
};

function parsePayload(body: string): UpdateObject {
  // message comes actually from SNS, so we need to parse it
  const message = JSON.parse(body) as SNSMessage;
  const messageVersion = JSON.parse(message.Message);

  return messageSchema.parse(messageVersion);
}