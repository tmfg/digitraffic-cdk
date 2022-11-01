import { ports } from "../../service/portareas";
import * as TimestampService from "../../service/timestamps";
import { PortactivityEnvKeys } from "../../keys";
import { SNS } from "aws-sdk";
import {
    DbSecret,
    SecretFunction,
    withDbSecret,
} from "@digitraffic/common/dist/aws/runtime/secrets/dbsecret";
import * as MessagingUtil from "@digitraffic/common/dist/aws/runtime/messaging";
import * as R from "ramda";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const publishTopic = envValue(PortactivityEnvKeys.PUBLISH_TOPIC_ARN);
const CHUNK_SIZE = 10;

const rdsHolder = RdsHolder.create();

export function handlerFn(withSecretFn: SecretFunction<DbSecret>, sns: SNS) {
    return () => {
        return rdsHolder.setCredentials().then(async () => {
            const ships = await TimestampService.findETAShipsByLocode(ports);
            console.info(
                "method=triggerAwakeAiETAShipTimestampsUpdateHandler Triggering ETA ship update for count=%d ships",
                ships.length
            );

            for (const ship of ships) {
                console.info(
                    "method=triggerAwakeAiETATimestampsUpdateHandler Triggering ETA update for ship with IMO: %d, LOCODE: %s, portcallid: %d",
                    ship.imo,
                    ship.locode,
                    ship.portcall_id
                );
            }

            for (const chunk of R.splitEvery(CHUNK_SIZE, ships)) {
                await MessagingUtil.snsPublish(
                    JSON.stringify(chunk),
                    publishTopic,
                    sns
                );
            }
        });
    };
}

export const handler = handlerFn(withDbSecret, new SNS());
