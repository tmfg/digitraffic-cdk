import {SNS} from "aws-sdk";

const topicArn = process.env.TOPIC_ARN as string;

const sns = new SNS();

export function notifyFailedItems(failedItems: any[]) {
    console.log("failed items " + JSON.stringify(failedItems));

    sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(failedItems)
    }, (err: any, data: any) => {
        if(err) {
            console.info("publish failed " + err);
        }
    });
}
