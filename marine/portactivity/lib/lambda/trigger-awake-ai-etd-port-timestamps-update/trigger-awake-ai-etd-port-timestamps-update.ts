import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ETD_PORTS } from "../../model/awake_etx_ports";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNS) {
    return async () => {
        console.info(
            "method=triggerAwakeAiETDPortTimestampsUpdate.handler Triggering ETD port update for count=%d ports",
            ETD_PORTS.length
        );
        for (const port of ETD_PORTS) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
