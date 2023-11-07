import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SNS } from "aws-sdk";
import * as R from "ramda";
import { PortactivityEnvKeys } from "../../keys";
import { ports } from "../../service/portareas";
import * as TimestampService from "../../service/timestamps";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const publishTopic = getEnvVariable(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);
const CHUNK_SIZE = 10;

const rdsHolder = RdsHolder.create();

export function handlerFn(sns: SNS): () => Promise<void> {
    return () => {
        return rdsHolder.setCredentials().then(async () => {
            const ships = await TimestampService.findETAShipsByLocode(ports);
            logger.info({
                method: "TriggerAwakeAiETATimestampsUpdate.handler",
                customShipTriggerCount: ships.length
            });

            for (const ship of ships) {
                logger.info({
                    method: "TriggerAwakeAiETATimestampsUpdate.handler",
                    message: `Triggering ETA update for ship with IMO: ${ship.imo}, LOCODE: ${ship.locode}, portcallid: ${ship.portcall_id}`
                });
            }

            for (const chunk of R.splitEvery(CHUNK_SIZE, ships)) {
                await MessagingUtil.snsPublish(JSON.stringify(chunk), publishTopic, sns);
            }
        });
    };
}

export const handler = handlerFn(new SNS());
