import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { ETA_PORTS } from "../../model/awake_etx_ports";

const publishTopic = envValue(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNS) {
    return async () => {
        console.info(
            "method=triggerAwakeAiETAPortTimestampsUpdate.handler Triggering ETA port update for count=%d ports",
            ETA_PORTS.length
        );
        for (const port of ETA_PORTS) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
