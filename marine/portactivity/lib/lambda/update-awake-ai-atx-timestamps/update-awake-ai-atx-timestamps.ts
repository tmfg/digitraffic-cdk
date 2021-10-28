import {SecretOptions, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {sendMessage} from "../../service/queue-service";
import {AwakeAiATXService} from "../../service/awake_ai_atx";
import {AwakeAiATXApi} from "../../api/awake_ai_atx";
import {Context} from "aws-lambda";
const WebSocket = require('ws');

type UpdateAwakeAiATXTimestampsSecret = {
    readonly atxurl: string
    readonly atxauth: string
}

let service: AwakeAiATXService;

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>, options: SecretOptions) => Promise<any>,
    AwakeAiATXServiceClass: new (api: AwakeAiATXApi) => AwakeAiATXService
): (event: object, context: Context) => Promise<any> {

    return (event: object, context: Context) => {
        const expectedKeys = [
            PortactivitySecretKeys.AWAKE_URL,
            PortactivitySecretKeys.AWAKE_AUTH
        ];

        return withDbSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiATXTimestampsSecret): Promise<any> => {
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
