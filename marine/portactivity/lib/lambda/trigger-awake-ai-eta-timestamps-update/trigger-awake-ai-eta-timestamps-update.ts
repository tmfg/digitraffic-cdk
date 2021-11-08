import {ports} from '../../service/portareas';
import * as TimestampService from '../../service/timestamps';
import {PortactivityEnvKeys} from "../../keys";
import {SNS} from "aws-sdk";
import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as SNSUtil from 'digitraffic-common/sns/sns';
import * as R from 'ramda';

const publishTopic = process.env[PortactivityEnvKeys.PUBLISH_TOPIC_ARN] as string;
const CHUNK_SIZE = 5;

export function handlerFn(
    withSecretFn: SecretFunction,
    sns: SNS) {
    return () => {
        return withSecretFn(process.env.SECRET_ID as string, async (): Promise<any> => {
            const ships = await TimestampService.findETAShipsByLocode(ports);

            for (const chunk of R.splitEvery(CHUNK_SIZE, ships)) {

                for (const ship of chunk) {
                    console.info('method=triggerAwakeAiETATimestampsUpdateHandler Triggering ETA update for ship IMOs %d, LOCODE %s, port call',
                        ship.imo,
                        ship.locode,
                        ship.portcall_id);
                }

                await SNSUtil.snsPublish(JSON.stringify(chunk), publishTopic, sns);
            }
        }, {});
    };
}

export const handler = handlerFn(withDbSecret, new SNS());
