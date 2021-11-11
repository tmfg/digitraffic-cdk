import {SecretFunction} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiETAService} from "../../service/awake_ai_eta";
import {AwakeAiVoyagesApi} from "../../api/awake_ai_voyages";
import {withSecret} from "digitraffic-common/secrets/secret";
import {SNSEvent} from "aws-lambda";
import {DbETAShip} from "../../db/timestamps";
import {sendMessage} from "../../service/queue-service";

type UpdateAwakeAiTimestampsSecret = {
    readonly 'awake.voyagesurl': string
    readonly 'awake.voyagesauth': string
}

let service: AwakeAiETAService;

const queueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH
];

export function handlerFn(
    withSecretFn: SecretFunction,
    AwakeAiETAServiceClass: new (api: AwakeAiVoyagesApi) => AwakeAiETAService,
): (event: SNSEvent) => Promise<any> {

    return (event: SNSEvent) => {
        // always a single event, guaranteed by SNS
        const ships = JSON.parse(event.Records[0].Sns.Message) as DbETAShip[];

        return withSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiTimestampsSecret): Promise<any> => {
            if (!service) {
                service = new AwakeAiETAServiceClass(new AwakeAiVoyagesApi(secret["awake.voyagesurl"], secret["awake.voyagesauth"]));
            }
            const timestamps = await service.getAwakeAiTimestamps(ships);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, queueUrl)));
        }, {expectedKeys});
    };
}

export const handler = handlerFn(withSecret, AwakeAiETAService);
