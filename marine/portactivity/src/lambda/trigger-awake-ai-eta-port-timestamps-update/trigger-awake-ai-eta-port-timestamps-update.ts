import { PortactivityEnvKeys } from "../../keys.js";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ETA_PORTS } from "../../model/awake-ai-etx-ports.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);

export function handlerFn(sns: SNSClient): () => Promise<void> {
  return async () => {
    logger.info({
      method: "TriggerAwakeAiETAPortTimestampsUpdate.handler",
      customPortTriggerCount: ETA_PORTS.length,
    });

    for (const port of ETA_PORTS) {
      await sns.send(
        new PublishCommand({ Message: port, TopicArn: publishTopic }),
      );
    }
  };
}

export const handler = handlerFn(new SNSClient({}));
