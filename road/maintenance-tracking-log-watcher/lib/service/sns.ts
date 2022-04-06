import {SNS} from 'aws-sdk';

export function sendEmail(message: string, snsTopicArn: string) {
    console.info(`method=sendEmail to ${snsTopicArn}`);
    return new SNS().publish({
        Message: message,
        TopicArn: snsTopicArn,
    }).promise();
}