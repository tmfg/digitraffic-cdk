import {ports} from '../../service/portareas';
import * as TimestampService from '../../service/timestamps';
import {SecretOptions, withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiETAService} from "../../service/awake_ai_eta";
import {AwakeAiETAApi} from "../../api/awake_ai_eta";
import {sendMessage} from "../../service/queue-service";

type UpdateAwakeAiTimestampsSecret = {
    readonly "awake.url": string
    readonly "awake.auth": string
}

let service: AwakeAiETAService;

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>, options: SecretOptions) => Promise<any>,
    AwakeAiETAServiceClass: new (api: AwakeAiETAApi) => AwakeAiETAService
): () => Promise<any> {

    return () => {
        const expectedKeys = [
            PortactivitySecretKeys.AWAKE_URL,
            PortactivitySecretKeys.AWAKE_AUTH
        ];

        return withDbSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiTimestampsSecret): Promise<any> => {
            if (!service) {
                service = new AwakeAiETAServiceClass(new AwakeAiETAApi(secret["awake.url"], secret["awake.auth"]));
            }
            const ships = await TimestampService.findETAShipsByLocode(ports);

            console.info(`method=updateAwakeAiTimestampsLambda fetching timestamps for ${ships.length} ships`);
            const timestamps = await service.getAwakeAiTimestamps(ships);
            console.info(`method=updateAwakeAiTimestampsLambda received timestamps for ${timestamps.length} ships`);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
        }, {expectedKeys});
    };
}

export const handler = handlerFn(withDbSecret, AwakeAiETAService);