import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {sendMessage} from "../../service/queue-service";
import {AwakeAiATXService} from "../../service/awake_ai_atx";
import {AwakeAiATXApi} from "../../api/awake_ai_atx";
import {Context} from "aws-lambda";
import {WebSocket} from "ws";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

interface UpdateAwakeAiATXTimestampsSecret {
    readonly atxurl: string
    readonly atxauth: string
}

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_ATX_URL,
    PortactivitySecretKeys.AWAKE_ATX_AUTH,
];

const dbSecretHolder = SecretHolder.create();
const secretHolder = SecretHolder.create<UpdateAwakeAiATXTimestampsSecret>('awake', expectedKeys);

let service: AwakeAiATXService | null = null;

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

export async function handler(event: unknown, context: Context) {
    await dbSecretHolder.setDatabaseCredentials()
        .then(() => secretHolder.get())
        .then(async (secret: UpdateAwakeAiATXTimestampsSecret) => {

            if (!service) {
                service = new AwakeAiATXService(new AwakeAiATXApi(secret.atxurl, secret.atxauth, WebSocket));
            }

            // allow 1000 ms for SQS sends, this is a completely made up number
            const timestamps = await service.getATXs(context.getRemainingTimeInMillis() - 1000);
            console.info('method=updateAwakeAiTimestampsLambda count=%d', timestamps.length);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
        });

}
