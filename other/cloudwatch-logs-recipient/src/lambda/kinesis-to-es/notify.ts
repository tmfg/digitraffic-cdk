import { SNS } from "aws-sdk";
import type { ItemStatus } from "./util.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const topicArn = getEnvVariable("TOPIC_ARN");

const sns = new SNS();

export function notifyFailedItems(failedItems: ItemStatus[]) {
    // eslint-disable-next-line no-console
    console.log(`failed items ${JSON.stringify(failedItems)}`);

    sns.publish(
        {
            TopicArn: topicArn,
            Message: JSON.stringify(failedItems)
        },
        (err?: Error) => {
            if (err) {
                // eslint-disable-next-line no-console
                console.info("publish failed", err.message);
            }
        }
    );
}
