import {SNS} from "aws-sdk";
import {ItemStatus} from "./util";

const topicArn = process.env.TOPIC_ARN as string;

const sns = new SNS();

export function notifyFailedItems(failedItems: ItemStatus[]) {
    console.log("failed items " + JSON.stringify(failedItems));

    sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(failedItems),
    }, (err) => {
        if (err) {
            console.info("publish failed " + err);
        }
    });
}
