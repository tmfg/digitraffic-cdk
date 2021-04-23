import * as TeqplayService from '../../service/teqplay';
import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";

export const handler = async function () {
    return withSecret(process.env.SECRET_ID as string, async (secret: any) => {
        const queueUrl = secret.teqplayQueueUrl;
        const sqsQueueUrl = secret.PORTACTIVITY_QUEUE;
        const timestamps = await TeqplayService.getMessagesFromTeqplay(queueUrl);

        console.info("sending %d messages", timestamps.length);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}