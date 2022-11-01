import { sendMessage } from "../../service/queue-service";
import * as PilotwebService from "../../service/pilotweb";
import { PortactivityEnvKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

interface PilotWebSecret {
    readonly url: string;
    readonly auth: string;
}

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<PilotWebSecret>("pilotweb");

export const handler = function (): Promise<void> {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            const timestamps = await PilotwebService.getMessagesFromPilotweb(
                secret.url,
                secret.auth
            );

            console.info("sending %d messages", timestamps.length);

            await Promise.allSettled(
                timestamps.map((ts) => sendMessage(ts, sqsQueueUrl))
            );
        })
        .catch((error) => {
            console.error("error %s", (error as Error).stack);
        });
};
