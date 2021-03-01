import {SQS} from "aws-sdk";

const sqs = new SQS();

export async function sendMessage(ts: any, sqsQueueUrl: string) {
    await sqs.sendMessage({
        MessageBody: JSON.stringify(ts),
        QueueUrl: sqsQueueUrl,
    }, (err: any, data: any) => {
        if (err) console.log("error " + err);
        //else console.log("success " + data.MessageId);
    });
}