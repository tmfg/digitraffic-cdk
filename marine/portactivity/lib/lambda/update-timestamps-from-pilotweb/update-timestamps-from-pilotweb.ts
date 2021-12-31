import {sendMessage} from "../../service/queue-service";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import * as PilotwebService from "../../service/pilotweb";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

type PilotWebSecret = {
    readonly 'pilotweb.url': string
    readonly 'pilotweb.auth': string
}

export const handler = function (): Promise<void> {
    return withDbSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: PilotWebSecret): Promise<void> => {
        const pilotwebUrl = secret[PortactivitySecretKeys.PILOTWEB_URL];
        const authHeader = secret[PortactivitySecretKeys.PILOTWEB_AUTH];

        const timestamps = await PilotwebService.getMessagesFromPilotweb(pilotwebUrl, authHeader);

        console.info("sending %d messages", timestamps.length);

        await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
    });
};
