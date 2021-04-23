import * as TeqplayService from '../../service/teqplay';
import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

const queueUrl = process.env[PortactivityEnvKeys.TEQPLAY_QUEUE] as string;

export const handler = async function () {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: any) => {
        const sqsQueueUrl = secret[PortactivitySecretKeys.PORTACTIVITY_QUEUE];
        const timestamps = await TeqplayService.getMessagesFromTeqplay(queueUrl);

        console.info("sending %d messages", timestamps.length);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}