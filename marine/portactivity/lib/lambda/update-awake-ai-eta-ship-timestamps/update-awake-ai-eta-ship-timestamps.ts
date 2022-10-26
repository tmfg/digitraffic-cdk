import {SecretFunction} from "@digitraffic/common/aws/runtime/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiETAShipService} from "../../service/awake_ai_eta_ship";
import {AwakeAiETAShipApi} from "../../api/awake_ai_ship";
import {withSecret} from "@digitraffic/common/aws/runtime/secrets/secret";
import {SNSEvent} from "aws-lambda";
import {DbETAShip} from "../../dao/timestamps";
import {sendMessage} from "../../service/queue-service";
import {UpdateAwakeAiTimestampsSecret} from "../../service/awake_ai_eta_helper";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

let service: AwakeAiETAShipService;

const queueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH,
];

export function handlerFn(withSecretFn: SecretFunction<UpdateAwakeAiTimestampsSecret>,
    AwakeAiETAServiceClass: new (api: AwakeAiETAShipApi) => AwakeAiETAShipService): (event: SNSEvent) => Promise<void> {

    return (event: SNSEvent) => {
        // always a single event, guaranteed by SNS
        const ships = JSON.parse(event.Records[0].Sns.Message) as DbETAShip[];

        return withSecretFn(envValue(PortactivityEnvKeys.SECRET_ID), async (secret: UpdateAwakeAiTimestampsSecret): Promise<void> => {
            if (!service) {
                service = new AwakeAiETAServiceClass(new AwakeAiETAShipApi(secret["awake.voyagesurl"], secret["awake.voyagesauth"]));
            }
            const timestamps = await service.getAwakeAiTimestamps(ships);

            const start = Date.now();
            console.info('method=updateAwakeAiETAShipTimestampsHandler Sending timestamps to queue..');
            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, queueUrl)));
            console.info('method=updateAwakeAiETAShipTimestampsHandler ..done in tookMs=%d', Date.now()-start);
        }, {expectedKeys});
    };
}

export const handler = handlerFn(withSecret, AwakeAiETAShipService);
