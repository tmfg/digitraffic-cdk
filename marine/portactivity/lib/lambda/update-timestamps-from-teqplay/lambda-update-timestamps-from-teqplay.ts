import {SQS} from 'aws-sdk';
import * as TeqplayService from '../../service/teqplay';
import {ApiTimestamp} from "../../model/timestamp";
import {withSecret} from "../../../../../common/secrets/secret";

const sqs = new SQS();

export const handler = async function () {
    return withSecret(process.env.SECRET_ID as string, async (secret: any) => {
        const queueUrl = secret.teqplayQueueUrl;
        const sqsQueueUrl = "https://sqs.eu-west-1.amazonaws.com/863956030060/PortActivity-Timestamps";
        const timestamps = await TeqplayService.getMessagesFromTeqplay(queueUrl);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}

async function sendMessage(ts: ApiTimestamp, sqsQueueUrl: string) {
    await sqs.sendMessage({
        MessageBody: JSON.stringify(ts),
        QueueUrl: sqsQueueUrl,
    }, (err: any, data: any) => {
        if (err) console.log("error " + err);
        //else console.log("success " + data.MessageId);
    });
}