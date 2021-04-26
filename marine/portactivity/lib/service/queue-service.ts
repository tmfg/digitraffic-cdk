import {SQS} from "aws-sdk";

const sqs = new SQS();

export async function sendMessage(ts: any, sqsQueueUrl: string) {
    await sqs.sendMessage({
        MessageBody: JSON.stringify(ts),
        QueueUrl: sqsQueueUrl,
    }).promise();
}
