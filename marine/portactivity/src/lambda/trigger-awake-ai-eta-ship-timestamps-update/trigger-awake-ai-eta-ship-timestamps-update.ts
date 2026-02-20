import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import _ from "lodash";
import { PortactivityEnvKeys } from "../../keys.js";
import { ports } from "../../service/portareas.js";
import * as TimestampService from "../../service/timestamps.js";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);
const CHUNK_SIZE = 10;

const rdsHolder = RdsHolder.create();

export function handlerFn(sns: SNSClient): () => Promise<void> {
  return () => {
    return rdsHolder.setCredentials().then(async () => {
      const ships = await TimestampService.findETAShipsByLocode(ports);
      logger.info({
        method: "TriggerAwakeAiETATimestampsUpdate.handler",
        customShipTriggerCount: ships.length,
      });

      for (const ship of ships) {
        logger.info({
          method: "TriggerAwakeAiETATimestampsUpdate.handler",
          message: `Triggering ETA update for ship with IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`,
        });
      }

      for (const chunk of _.chunk(ships, CHUNK_SIZE)) {
        await sns.send(
          new PublishCommand({
            Message: JSON.stringify(chunk),
            TopicArn: publishTopic,
          }),
        );
      }
    });
  };
}

export const handler = handlerFn(new SNSClient({}));
