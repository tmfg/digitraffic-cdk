import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  maxAttempts: 3,
  retryMode: "STANDARD",
});

export async function sendToSqs(
  queueUrl: string,
  messageBody: string,
): Promise<void> {
  const message = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  });

  await sqsClient.send(message);
}
