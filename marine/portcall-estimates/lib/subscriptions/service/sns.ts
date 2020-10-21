import {SNS} from 'aws-sdk';
import {ShiplistEstimate} from "../db/db-shiplist";

const moment = require('moment-timezone');

export async function sendEstimatesEmail(locode: string, estimates: ShiplistEstimate[]) {
    return await sendEmail(convertToSms(moment(Date.now()).format("D.MM"), locode, estimates));
}

export async function sendEmail(message: string): Promise<any> {
    return new SNS().publish({
        Message: message,
        TopicArn: process.env.SHIPLIST_SNS_TOPIC_ARN
    }).promise();
}

function convertToSms(date: string, locode: string, estimates: ShiplistEstimate[]): string {
    let currentDate = new Date();

    const shiplist = estimates.map(e => {
        let timestring = moment(e.event_time).format("HH:mm");

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            timestring = moment(e.event_time).format("D.MM HH:mm")
        }

        return `${e.event_type} ${e.event_source} ${timestring} ${e.ship_name}`; }
    ).join('\n');

    return `Laivalista ${date} ${locode}:\n${shiplist}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
