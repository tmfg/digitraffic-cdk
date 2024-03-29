import { SNS } from "aws-sdk";
import { ItemStatus } from "./util";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const topicArn = getEnvVariable("TOPIC_ARN");

const sns = new SNS();

export function notifyFailedItems(failedItems: ItemStatus[]) {
    console.log(`failed items ${JSON.stringify(failedItems)}`);

    sns.publish(
        {
            TopicArn: topicArn,
            Message: JSON.stringify(failedItems),
        },
        (err?: Error) => {
            if (err) {
                console.info("publish failed", err.message);
            }
        }
    );
}
