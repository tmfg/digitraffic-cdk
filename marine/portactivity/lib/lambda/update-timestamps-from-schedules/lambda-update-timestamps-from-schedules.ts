import {withSecret} from "@digitraffic/common/aws/runtime/secrets/secret";
import {sendMessage} from "../../service/queue-service";
import {PortactivityEnvKeys, PortactivitySecretKeys} from "../../keys";
import {SchedulesApi} from "../../api/schedules";
import {SchedulesService} from "../../service/schedules";
import {SecretFunction} from "@digitraffic/common/aws/runtime/secrets/dbsecret";
import {envValue} from "@digitraffic/common/aws/runtime/environment";

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);
const SECRET_ID = envValue(PortactivityEnvKeys.SECRET_ID);

export interface SchedulesSecret {
    readonly "schedules.url": string
}

let service: SchedulesService;

export const handler = handlerFn(withSecret, SchedulesService, sendMessage);

export function handlerFn(withDbSecretFn: SecretFunction<SchedulesSecret>,
    SchedulesServiceClass: { new(api: SchedulesApi): SchedulesService },
    sendMessageFn: (ts: unknown, sqsQueueUrl: string) => Promise<void>) {
    return () => {
        return withDbSecretFn(SECRET_ID, async (secret: SchedulesSecret) => {
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
