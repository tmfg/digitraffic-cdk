import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {SNSEvent} from "aws-lambda";
import {sendMessage} from "../../service/queue-service";
import {AwakeAiETAPortApi} from "../../api/awake_ai_port";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import {AwakeAiETAPortService} from "../../service/awake_ai_eta_port";
import {GenericSecret} from "@digitraffic/common/aws/runtime/secrets/secret";

const queueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_URL,
    PortactivitySecretKeys.AWAKE_AUTH,
];

const dbSecretHolder = SecretHolder.create<GenericSecret>("", expectedKeys);

let service: AwakeAiETAPortService

export function handler(event: SNSEvent): Promise<void> {
    return dbSecretHolder.setDatabaseCredentials()
        .then(() => dbSecretHolder.get())
        .then(async secret => {
            // always a single event, guaranteed by SNS
            const locode = event.Records[0].Sns.Message;

            if (!service) {
                service = new AwakeAiETAPortService(new AwakeAiETAPortApi(secret["awake.voyagesurl"], secret["awake.voyagesauth"]));
            }
            const timestamps = await service.getAwakeAiTimestamps(locode);

            const start = Date.now();
            console.info(`method=updateAwakeAiETAPortTimestampsHandler Sending ${timestamps.length} timestamps to queue..`);
            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, queueUrl)));
            console.info('method=updateAwakeAiETAPortTimestampsHandler ..done in tookMs=%d', Date.now() - start);
        });
}