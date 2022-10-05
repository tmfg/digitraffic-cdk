import {SecretFunction} from "@digitraffic/common/aws/runtime/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {withSecret} from "@digitraffic/common/aws/runtime/secrets/secret";
import {SNSEvent} from "aws-lambda";
import {sendMessage} from "../../service/queue-service";
import {AwakeAiETAPortApi} from "../../api/awake_ai_port";
import {AwakeAiETAPortService} from "../../service/awake_ai_eta_port";
import {UpdateAwakeAiTimestampsSecret} from "../../service/awake_ai_eta_helper";

let service: AwakeAiETAPortService;

const queueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH,
];

export function handlerFn(withSecretFn: SecretFunction<UpdateAwakeAiTimestampsSecret, void>,
    AwakeAiETAServiceClass: new (api: AwakeAiETAPortApi) => AwakeAiETAPortService): (event: SNSEvent) => Promise<void> {

    return (event: SNSEvent) => {
        // always a single event, guaranteed by SNS
        const locode = event.Records[0].Sns.Message;

        return withSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiTimestampsSecret): Promise<void> => {
            if (!service) {
                service = new AwakeAiETAServiceClass(new AwakeAiETAPortApi(secret["awake.voyagesurl"], secret["awake.voyagesauth"]));
            }
            const timestamps = await service.getAwakeAiTimestamps(locode);

            const start = Date.now();
            console.info(`method=updateAwakeAiETAPortTimestampsHandler Sending ${timestamps.length} timestamps to queue..`);
            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, queueUrl)));
            console.info('method=updateAwakeAiETAPortTimestampsHandler ..done in tookMs=%d', Date.now()-start);
        }, {expectedKeys});
    };
}

export const handler = handlerFn(withSecret, AwakeAiETAPortService);
