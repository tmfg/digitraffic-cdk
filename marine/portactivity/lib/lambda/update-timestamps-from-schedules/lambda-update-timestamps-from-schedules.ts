import {withSecret} from "digitraffic-common/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {SecretFunction} from "digitraffic-common/secrets/dbsecret";
import {SchedulesApi} from "../../api/schedules";
import {SchedulesService} from "../../service/schedules";

const sqsQueueUrl = process.env[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] as string;

export type SchedulesSecret = {
    readonly "schedules.url": string
}

let service: SchedulesService;

export const handler = handlerFn(withSecret, SchedulesService, sendMessage);

export function handlerFn(withDbSecretFn: SecretFunction<SchedulesSecret, void>,
    SchedulesServiceClass: { new(api: SchedulesApi): SchedulesService },
    sendMessageFn: (ts: unknown, sqsQueueUrl: string) => Promise<void>) {
    return () => {
        return withDbSecretFn(process.env[PortactivityEnvKeys.SECRET_ID] as string, async (secret: SchedulesSecret) => {
            if (!service) {
                const schedulesUrl = secret[PortactivitySecretKeys.SCHEDULES_URL];
                service = new SchedulesServiceClass(new SchedulesApi(schedulesUrl));
            }

            const vtsControlTimestamps = await service.getTimestampsUnderVtsControl();
            const calculatedTimestamps = await service.getCalculatedTimestamps();
            const timestamps = vtsControlTimestamps.concat(calculatedTimestamps);

            console.info("method=updateTimestampsFromSchedules count=%d", timestamps.length);

            await Promise.allSettled(timestamps.map(ts => sendMessageFn(ts, sqsQueueUrl)));
        });
    };
}
