import {SNS} from 'aws-sdk';

export async function sendEmail(message: string, snsTopicArn: string): Promise<any> {
    console.info(`method=sendEmail to ${snsTopicArn}`);
    return new SNS().publish({
        Message: message,
        TopicArn: snsTopicArn,
    }).promise();
}