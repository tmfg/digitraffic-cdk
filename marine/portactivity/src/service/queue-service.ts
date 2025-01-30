import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

export async function sendMessage(
  ts: unknown,
  sqsQueueUrl: string,
): Promise<void> {
  if (ts) {
    await sqs.send(
      new SendMessageCommand({
        MessageBody: JSON.stringify(ts),
        QueueUrl: sqsQueueUrl,
      }),
    );
  }
}
