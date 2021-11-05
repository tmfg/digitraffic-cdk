import {SecretOptions, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiETAService} from "../../service/awake_ai_eta";
import {AwakeAiETAApi} from "../../api/awake_ai_eta";
import {withSecret} from "digitraffic-common/secrets/secret";
import {SNSEvent} from "aws-lambda";
import {DbETAShip} from "../../db/timestamps";
import {sendMessage} from "../../service/queue-service";

type UpdateAwakeAiTimestampsSecret = {
    readonly 'awake.url': string
    readonly 'awake.auth': string
}

let service: AwakeAiETAService;

const queueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export function handlerFn(
    withSecretFn: (secretId: string, fn: (_: any) => Promise<void>, options: SecretOptions) => Promise<any>,
    AwakeAiETAServiceClass: new (api: AwakeAiETAApi) => AwakeAiETAService,
): (event: SNSEvent) => Promise<any> {

    return (event: SNSEvent) => {
        // always a single event, guaranteed by SNS
        const ship = JSON.parse(event.Records[0].Sns.Message) as DbETAShip;

        const expectedKeys = [
            PortactivitySecretKeys.AWAKE_URL,
            PortactivitySecretKeys.AWAKE_AUTH
        ];

        return withSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiTimestampsSecret): Promise<any> => {
            if (!service) {
                service = new AwakeAiETAServiceClass(new AwakeAiETAApi(secret["awake.url"], secret["awake.auth"]));
            }
            const timestamp = await service.getAwakeAiTimestamp(ship);
            if (!timestamp) {
                throw new Error(`No ETA received for ship IMO: ${ship.imo}`);
            }
            await sendMessage(timestamp, queueUrl);
        }, {expectedKeys});
    };
}

export const handler = handlerFn(withSecret, AwakeAiETAService);
