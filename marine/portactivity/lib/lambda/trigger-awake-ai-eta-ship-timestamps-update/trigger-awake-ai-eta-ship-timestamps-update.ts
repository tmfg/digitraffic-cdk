import {ports} from '../../service/portareas';
import * as TimestampService from '../../service/timestamps';
import {PortactivityEnvKeys} from "../../keys";
import {SNS} from "aws-sdk";
import {DbSecret, SecretFunction, withDbSecret} from "@digitraffic/common/aws/runtime/secrets/dbsecret";
import * as MessagingUtil from 'digitraffic-common/aws/runtime/messaging';
import * as R from 'ramda';

const publishTopic = process.env[PortactivityEnvKeys.PUBLISH_TOPIC_ARN] as string;
const CHUNK_SIZE = 10;

export function handlerFn(withSecretFn: SecretFunction<DbSecret, void>, sns: SNS) {
    return () => {
        return withSecretFn(process.env.SECRET_ID as string, async (): Promise<void> => {
            const ships = await TimestampService.findETAShipsByLocode(ports);
            console.info('method=triggerAwakeAiETAShipTimestampsUpdateHandler Triggering ETA ship update for count=%d ships',
                ships.length);

            for (const ship of ships) {
                console.info('method=triggerAwakeAiETATimestampsUpdateHandler Triggering ETA update for ship with IMO: %d, LOCODE: %s, portcallid: %d',
                    ship.imo, ship.locode, ship.portcall_id);
            }

            for (const chunk of R.splitEvery(CHUNK_SIZE, ships)) {
                await MessagingUtil.snsPublish(JSON.stringify(chunk), publishTopic, sns);
            }
        }, {});
    };
}

export const handler = handlerFn(withDbSecret, new SNS());
