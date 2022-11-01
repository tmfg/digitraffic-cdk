import { sendMessage } from "../../service/queue-service";
import { PortactivityEnvKeys } from "../../keys";
import { SchedulesApi } from "../../api/schedules";
import { SchedulesService } from "../../service/schedules";
import { envValue } from "@digitraffic/common/dist/aws/runtime/environment";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

const sqsQueueUrl = envValue(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<SchedulesSecret>("schedules");

export interface SchedulesSecret {
    readonly url: string;
}

let service: SchedulesService | undefined;

export const handler = () => {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            if (!service) {
                service = new SchedulesService(new SchedulesApi(secret.url));
            }

            const vtsControlTimestamps =
                await service.getTimestampsUnderVtsControl();
            const calculatedTimestamps =
                await service.getCalculatedTimestamps();
            const timestamps =
                vtsControlTimestamps.concat(calculatedTimestamps);

            console.info(
                "method=updateTimestampsFromSchedules count=%d",
                timestamps.length
            );

            await Promise.allSettled(
                timestamps.map((ts) => sendMessage(ts, sqsQueueUrl))
            );
        });
};
