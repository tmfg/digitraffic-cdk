import {SQS} from 'aws-sdk';
import * as TeqplayService from '../../service/teqplay';
import {ApiTimestamp} from "../../model/timestamp";

const sqs = new SQS();
const QUEUE_URL = process.env.ESTIMATE_SQS_QUEUE_URL as string;

export const handler = async function () {
    await TeqplayService.getMessagesFromTeqplay().then((timestamps: ApiTimestamp[]) => {
        timestamps.forEach(sendMessage)
    });
}

function sendMessage(ts: ApiTimestamp) {
    sqs.sendMessage({
        MessageBody: JSON.stringify(ts),
        QueueUrl: QUEUE_URL,
    }, (err: any, data: any) => {
        if (err) console.log("error " + err);
        else console.log("success " + data.MessageId);
    });
}