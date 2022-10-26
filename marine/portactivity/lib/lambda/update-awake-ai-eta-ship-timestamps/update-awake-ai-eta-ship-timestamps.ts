import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiETAShipService} from "../../service/awake_ai_eta_ship";
import {AwakeAiETAShipApi} from "../../api/awake_ai_ship";
import {SNSEvent} from "aws-lambda";
import {DbETAShip} from "../../dao/timestamps";
import {sendMessage} from "../../service/queue-service";
import {UpdateAwakeAiTimestampsSecret} from "../../service/awake_ai_eta_helper";
import {envValue} from "@digitraffic/common/aws/runtime/environment";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";

let service: AwakeAiETAShipService | undefined;

const queueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

const secretHolder = SecretHolder.create<UpdateAwakeAiTimestampsSecret>("awake", [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH,
]);

export const handler = (event: SNSEvent) => {
    // always a single event, guaranteed by SNS
    const ships = JSON.parse(event.Records[0].Sns.Message) as DbETAShip[];

    return secretHolder.get()
        .then(async secret => {
            if (!service) {
                service = new AwakeAiETAShipService(new AwakeAiETAShipApi(secret.voyagesurl, secret.voyagesauth));
            }
            const timestamps = await service.getAwakeAiTimestamps(ships);

            const start = Date.now();
            console.info('method=updateAwakeAiETAShipTimestampsHandler Sending timestamps to queue..');
            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, queueUrl)));
            console.info('method=updateAwakeAiETAShipTimestampsHandler ..done in tookMs=%d', Date.now() - start);
        });
};
