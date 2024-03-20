import { PortactivityEnvKeys } from "../../keys.js";
import { SNS } from "aws-sdk";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ETA_PORTS } from "../../model/awake-ai-etx-ports.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNS): () => Promise<void> {
    return async () => {
        logger.info({
            method: "TriggerAwakeAiETAPortTimestampsUpdate.handler",
            customPortTriggerCount: ETA_PORTS.length
        });

        for (const port of ETA_PORTS) {
            await MessagingUtil.snsPublish(port, publishTopic, sns);
        }
    };
}

export const handler = handlerFn(new SNS());
