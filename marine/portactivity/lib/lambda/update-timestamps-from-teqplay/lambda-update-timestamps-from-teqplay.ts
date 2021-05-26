import * as TeqplayService from '../../service/teqplay';
import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export const handler = async function () {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: any) => {
        const queueUrl = secret[PortactivitySecretKeys.TEQPLAY_QUEUE];

        const timestamps = await TeqplayService.getMessagesFromTeqplay(queueUrl);

        console.info("sending %d messages", timestamps.length);

        await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
    });
}