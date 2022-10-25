import {sendMessage} from "../../service/queue-service";
import * as PilotwebService from "../../service/pilotweb";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {SecretHolder} from "@digitraffic/common/aws/runtime/secrets/secret-holder";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

interface PilotWebSecret {
    readonly 'pilotweb.url': string
    readonly 'pilotweb.auth': string
}

const secretHolder = SecretHolder.create<PilotWebSecret>("pilotweb");

export const handler = function (): Promise<void> {
    return secretHolder.setDatabaseCredentials()
        .then(() => secretHolder.get())
        .then(async secret => {
            const pilotwebUrl = secret[PortactivitySecretKeys.PILOTWEB_URL];
            const authHeader = secret[PortactivitySecretKeys.PILOTWEB_AUTH];

            const timestamps = await PilotwebService.getMessagesFromPilotweb(pilotwebUrl, authHeader);

            console.info("sending %d messages", timestamps.length);

            await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
        });
};
