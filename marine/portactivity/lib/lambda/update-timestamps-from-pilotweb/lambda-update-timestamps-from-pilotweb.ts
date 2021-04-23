import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import * as PilotwebService from "../../service/pilotweb";

enum ProjectKeys {
    SECRET_ID= "SECRET_ID"
}

export const handler = async function () {
    return withSecret(process.env[ProjectKeys.SECRET_ID] as string, async (secret: any) => {
        const url = secret.PILOTWEB_URL;
        const authHeader = secret.PILOTWEB_AUTH;
        const sqsQueueUrl = secret.PORTACTIVITY_QUEUE;
        const timestamps = await PilotwebService.getMessagesFromPilotweb(url, authHeader);

        console.info("sending %d messages", timestamps.length);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}