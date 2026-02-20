import type {
  Message,
  MessageAttributeValue,
  ReceiveMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import type { SQSEvent, SQSMessageAttribute } from "aws-lambda";
import ExtendedSqsClient from "sqs-extended-client";
import { MaintenanceTrackingEnvKeys } from "../keys.js";

export function createExtendedSqsClient(): ExtendedSqsClient {
  return new ExtendedSqsClient({
    bucketName: getEnvVariable(MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME),
    // alwaysUseS3: true If also small messages should go through S3
    sqsClientConfig: {
      region: getEnvVariable("AWS_REGION"),
    },
  });
}

export function createSqsReceiveMessageCommandOutput(
  event: SQSEvent,
): ReceiveMessageCommandOutput {
  const messages: Message[] = event.Records.map((r) => {
    const messageAttributes: Record<string, MessageAttributeValue> = {};
    Object.keys(r.messageAttributes).forEach((key) => {
      const value: SQSMessageAttribute | undefined = r.messageAttributes[key];
      // We are actually only interested of key: S3MessageBodyKey
      if (
        value?.stringValue &&
        (value.dataType === "String" || value.dataType === "string")
      ) {
        const mav: MessageAttributeValue = {
          StringValue: value.stringValue,
          DataType: "String",
        };
        Object.assign(messageAttributes, { [key]: mav });
      }
    });

    return {
      MessageId: r.messageId,
      ReceiptHandle: r.receiptHandle,
      MD5OfBody: r.md5OfBody,
      Body: r.body,
      //Attributes: don't care
      //MD5OfMessageAttributes: don't care
      // Here we have reference to S3
      MessageAttributes: messageAttributes,
    } satisfies Message;
  });

  return {
    Messages: messages,
    $metadata: {},
  } satisfies ReceiveMessageCommandOutput;
}
