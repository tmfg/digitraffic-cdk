import {withSecret} from "digitraffic-common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import * as SchedulesService from "../../service/schedules";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export const handler = async function () {
    return withSecret(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: any) => {
        const schedulesUrl = secret[PortactivitySecretKeys.SCHEDULES_URL];

        const vtsControlTimestamps = await SchedulesService.getTimestampsUnderVtsControl(schedulesUrl);
        const calculatedTimestamps = await SchedulesService.getCalculatedTimestamps(schedulesUrl);
        const timestamps = vtsControlTimestamps.concat(calculatedTimestamps);

        console.info("method=updateTimestampsFromSchedules count=%d", timestamps.length);

        await Promise.allSettled(timestamps.map(ts => sendMessage(ts, sqsQueueUrl)));
    });
}
