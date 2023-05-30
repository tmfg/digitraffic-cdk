import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { SchedulesApi } from "../../api/schedules";
import { PortactivityEnvKeys } from "../../keys";
import { sendMessage } from "../../service/queue-service";
import { SchedulesService } from "../../service/schedules";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const sqsQueueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<SchedulesSecret>("schedules");

export interface SchedulesSecret extends GenericSecret {
    readonly url: string;
}

let service: SchedulesService | undefined;

export const handler = (): Promise<void> => {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            if (!service) {
                service = new SchedulesService(new SchedulesApi(secret.url));
            }

            const vtsControlTimestamps = await service.getTimestampsUnderVtsControl();
            const calculatedTimestamps = await service.getCalculatedTimestamps();
            const timestamps = vtsControlTimestamps.concat(calculatedTimestamps);

            logger.info({
                method: "UpdateSchedulesTimestamps.handler",
                message: `received ${timestamps.length} timestamps`
            });

            await Promise.allSettled(timestamps.map((ts) => sendMessage(ts, sqsQueueUrl)));
        });
};
