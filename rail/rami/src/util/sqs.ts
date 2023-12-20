import { SQSClient, SendMessageCommand, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { setTimeout } from "timers/promises";

export async function sendToSqs(
    queueUrl: string,
    retries: number,
    message: string,
    messageId: string = "unknown"
): Promise<void> {
    const result = await doSendToSqs(queueUrl, message);
    if (result.MessageId) {
        logger.info({
            method: "rami.sendToSqs",
            customSentMessageId: messageId,
            customSqsMessageId: result.MessageId
        });
    } else if (retries > 0) {
        const delay = 500 * 2 ** retries;
        await setTimeout(delay);
        logger.debug({
            method: "rami.sendToSqs",
            message: `Retry sending to queue ${queueUrl} message id ${messageId}`
        });
        await sendToSqs(queueUrl, retries - 1, message, messageId);
    } else {
        logger.error({
            method: "rami.sendToSqs",
            message: `Failed to send to queue ${queueUrl} message id ${messageId}`
        });
    }
}

async function doSendToSqs(queueUrl: string, messageBody: string): Promise<SendMessageCommandOutput> {
    const client = new SQSClient({});
    const message = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody
    });
    return await client.send(message);
}
