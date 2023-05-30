import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ETD_PORTS } from "../../model/awake_etx_ports";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNS) {
    return async () => {
        logger.info({
            method: "TriggerAwakeAiETDPortTimestampsUpdate.handler",
            message: `Triggering ETD port update for ${ETD_PORTS.length} ports`
        });
        for (const port of ETD_PORTS) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
