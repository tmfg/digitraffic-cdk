// TODO: v3
import { SQS } from "aws-sdk";

const sqs = new SQS();

export async function sendMessage(ts: unknown, sqsQueueUrl: string): Promise<void> {
    if (ts) {
        await sqs
            .sendMessage({
                MessageBody: JSON.stringify(ts),
                QueueUrl: sqsQueueUrl
            })
            .promise();
    }
}
