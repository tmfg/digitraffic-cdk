import { PortactivityEnvKeys, PortactivitySecretKeys } from "../../keys";
import { sendMessage } from "../../service/queue-service";
import { AwakeAiATXService } from "../../service/awake_ai_atx";
import { AwakeAiATXApi } from "../../api/awake_ai_atx";
import { Context } from "aws-lambda";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import WebSocket from "ws";

interface UpdateAwakeAiATXTimestampsSecret extends GenericSecret {
    readonly atxurl: string;
    readonly atxauth: string;
}

const expectedKeys = [
    PortactivitySecretKeys.AWAKE_ATX_URL,
    PortactivitySecretKeys.AWAKE_ATX_AUTH
];

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<UpdateAwakeAiATXTimestampsSecret>(
    "awake",
    expectedKeys
);

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

// allow 10000 ms for SQS sends, this is a completely made up number
const SQS_SEND_TIME = 10000;

export async function handler(event: unknown, context: Context) {
    await rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret: UpdateAwakeAiATXTimestampsSecret) => {
            
            const service = new AwakeAiATXService(
                new AwakeAiATXApi(secret.atxurl, secret.atxauth, WebSocket)
            );

            const timestamps = await service.getATXs(
                context.getRemainingTimeInMillis() - SQS_SEND_TIME
            );
            console.info(
                "method=updateAwakeAiAtxTimestamps.handler count=%d",
                timestamps.length
            );

            await Promise.allSettled(
                timestamps.map((ts) => sendMessage(ts, sqsQueueUrl))
            );
        });
}
