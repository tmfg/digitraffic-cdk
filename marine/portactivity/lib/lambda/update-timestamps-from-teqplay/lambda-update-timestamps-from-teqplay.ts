import {SQS} from 'aws-sdk';
import * as TeqplayService from '../../service/teqplay';
import {ApiTimestamp} from "../../model/timestamp";
import {withSecret} from "../../../../../common/secrets/secret";

const sqs = new SQS();

export const handler = async function () {
    await withSecret(process.env.SECRET_ID as string, (secret: any) => {
        const queueUrl = secret.teqplayQueueUrl;

        TeqplayService.getMessagesFromTeqplay().then((timestamps: ApiTimestamp[]) => {
            timestamps.forEach(ts => sendMessage(ts, queueUrl));
        });
    });
}

function sendMessage(ts: ApiTimestamp, queueUrl: string) {
    sqs.sendMessage({
        MessageBody: JSON.stringify(ts),
        QueueUrl: queueUrl,
    }, (err: any, data: any) => {
        if (err) console.log("error " + err);
        else console.log("success " + data.MessageId);
    });
}