import {SNS} from 'aws-sdk';

export async function sendEmail(message: string): Promise<any> {
    return new SNS().publish({
        Message: message,
        TopicArn: process.env.SHIPLIST_SNS_TOPIC_ARN
    }).promise();
}