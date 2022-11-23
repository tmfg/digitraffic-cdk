import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";

const publishTopic = envValue(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

// TODO in the future, use ports list
const ports = ["FIKOK", "FIRAU", "FIOUL", "FIKEM", "FIKJO", "FIUKI", "FIPOR"];

export function handlerFn(sns: SNS) {
    return async () => {
        console.info(
            "method=triggerAwakeAiETAPortTimestampsUpdateHandler Triggering ETA port update for count=%d ports",
            ports.length
        );
        for (const port of ports) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
