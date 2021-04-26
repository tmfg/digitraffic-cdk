import {withSecret} from "../../../../../common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import * as SchedulesService from "../../service/schedules";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

export const handler = async function () {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: any) => {
        const schedulesUrl = secret[PortactivitySecretKeys.SCHEDULES_URL];
        const sqsQueueUrl = secret[PortactivitySecretKeys.PORTACTIVITY_QUEUE];

        const vtsControlTimestamps = await SchedulesService.getTimestampsUnderVtsControl(schedulesUrl);
        const calculatedTimestamps = await SchedulesService.getCalculatedTimestamps(schedulesUrl);
        const timestamps = vtsControlTimestamps.concat(calculatedTimestamps);

        console.info("sending %d messages", timestamps.length);

        timestamps.forEach(ts => sendMessage(ts, sqsQueueUrl));
    });
}
