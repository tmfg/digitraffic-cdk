import {getPortAreaGeometries} from '../../service/portareas';
import * as TimestampService from '../../service/timestamps';
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {AwakeAiService} from "../../service/awake_ai";
import {AwakeAiApi} from "../../api/awake_ai";
import {sendMessage} from "../../service/queue-service";

const portAreaGeometries = getPortAreaGeometries();
const locodes = portAreaGeometries.map(p => p.locode);

type UpdateAwakeAiTimestampsSecret = {
    readonly "awake.url": string
    readonly "awake.auth": string
}

let service: AwakeAiService;

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export function handlerFn(
    withDbSecretFn: (secretId: string, fn: (_: any) => Promise<void>, expectedKeys: string[]) => Promise<any>,
    AwakeAiServiceClass: new (api: AwakeAiApi) => AwakeAiService
): () => Promise<any> {

    return () => {
        const expectedKeys = [
            PortactivitySecretKeys.AWAKE_URL,
            PortactivitySecretKeys.AWAKE_AUTH
        ];

        return withDbSecretFn(process.env.SECRET_ID as string, async (secret: UpdateAwakeAiTimestampsSecret): Promise<any> => {
            if (!service) {
                service = new AwakeAiServiceClass(new AwakeAiApi(secret["awake.url"], secret["awake.auth"]));
            }
            const ships = await TimestampService.findETAShipsByLocode(locodes, portAreaGeometries);

            console.info(`method=updateAwakeAiTimestampsLambda fetching timestamps for ${ships.length} ships`);
            const timestamps = await service.getAwakeAiTimestamps(ships);
            console.info(`method=updateAwakeAiTimestampsLambda received timestamps for ${timestamps.length} ships`);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
        }, expectedKeys);
    };
}

export const handler = handlerFn(withDbSecret, AwakeAiService);