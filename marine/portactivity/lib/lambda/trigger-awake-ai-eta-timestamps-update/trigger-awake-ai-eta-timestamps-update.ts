import {ports} from '../../service/portareas';
import * as TimestampService from '../../service/timestamps';
import {PortactivityEnvKeys} from "../../keys";
import {SNS} from "aws-sdk";
import {SecretOptions, withDbSecret} from "digitraffic-common/secrets/dbsecret";

const publishTopic = process.env[PortactivityEnvKeys.PUBLISH_TOPIC_ARN] as string;

export function handlerFn(
    withSecretFn: (secretId: string, fn: (_: any) => Promise<void>, options: SecretOptions) => Promise<any>,
    sns: SNS) {
    return () => {
        return withSecretFn(process.env.SECRET_ID as string, async (): Promise<any> => {
            const ships = await TimestampService.findETAShipsByLocode(ports);
            for (const ship of ships) {
                console.info('method=triggerAwakeAiETATimestampsUpdateHandler Triggering ETA update for ship IMO %d, LOCODE %s, port call',
                    ship.imo,
                    ship.locode,
                    ship.portcall_id);
                await sns.publish({
                    Message: JSON.stringify(ship),
                    TopicArn: publishTopic
                }).promise();
            }
        }, {});
    };
}

export const handler = handlerFn(withDbSecret, new SNS());
