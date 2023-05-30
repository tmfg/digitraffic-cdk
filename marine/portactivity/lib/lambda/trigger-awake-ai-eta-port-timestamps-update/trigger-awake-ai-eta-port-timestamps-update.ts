import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { ETA_PORTS } from "../../model/awake_etx_ports";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const publishTopic = envValue(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNS) {
    return async () => {
        logger.info({
            method: "TriggerAwakeAiETAPortTimestampsUpdate.handler",
            message: `Triggering ETA port update for ${ETA_PORTS.length} ports`
        });
        for (const port of ETA_PORTS) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
