import {SecretFunction, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {sendMessage} from "../../service/queue-service";
import {AwakeAiATXService} from "../../service/awake_ai_atx";
import {AwakeAiATXApi} from "../../api/awake_ai_atx";
import {Context} from "aws-lambda";
import WebSocket from "ws";

type UpdateAwakeAiATXTimestampsSecret = {
    readonly atxurl: string
    readonly atxauth: string
}

let service: AwakeAiATXService;

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export function handlerFn(
    withDbSecretFn: SecretFunction<UpdateAwakeAiATXTimestampsSecret, void>,
    AwakeAiATXServiceClass: new (api: AwakeAiATXApi) => AwakeAiATXService
): (event: unknown, context: Context) => Promise<void> {

    return (event: unknown, context: Context) => {
        const expectedKeys = [
            PortactivitySecretKeys.AWAKE_ATX_URL,
            PortactivitySecretKeys.AWAKE_ATX_AUTH
        ];

        return withDbSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiATXTimestampsSecret): Promise<void> => {
            if (!service) {
                service = new AwakeAiATXServiceClass(
                    new AwakeAiATXApi(secret.atxurl, secret.atxauth, WebSocket));
            }

            // allow 1000 ms for SQS sends, this is a completely made up number
            const timestamps = await service.getATXs(context.getRemainingTimeInMillis() - 1000);
            console.info('method=updateAwakeAiTimestampsLambda count=%d', timestamps.length);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
        }, {expectedKeys, prefix: 'awake'});
    };
}

export const handler = handlerFn(withDbSecret, AwakeAiATXService);
