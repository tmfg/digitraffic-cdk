import { PortactivityEnvKeys, PortactivitySecretKeys } from "../../keys";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { AwakeAiETDPortService } from "../../service/awake-ai-etd-port";
import { AwakeAiPortApi } from "../../api/awake-ai-port";
import type { SNSEvent } from "aws-lambda";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { sendMessage } from "../../service/queue-service";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { UpdateAwakeAiETXTimestampsSecret } from "../../model/secret";

const queueUrl = getEnvVariable(PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL);

const expectedKeys = [PortactivitySecretKeys.AWAKE_URL, PortactivitySecretKeys.AWAKE_AUTH];

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<UpdateAwakeAiETXTimestampsSecret>("awake", expectedKeys);

let service: AwakeAiETDPortService | undefined;

export function handler(event: SNSEvent): Promise<void> {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then(async (secret) => {
            // always a single event, guaranteed by SNS
            const locode = event.Records[0]?.Sns.Message as unknown as string;

            if (!service) {
                service = new AwakeAiETDPortService(
                    new AwakeAiPortApi(secret.voyagesurl, secret.voyagesauth)
                );
            }
            const timestamps = await service.getAwakeAiTimestamps(locode);

            const start = Date.now();
            logger.info({
                method: "UpdateAwakeAiETDPortTimestamps.handler",
                customTimestampsReceivedCount: timestamps.length
            });
            await Promise.allSettled(timestamps.map((ts) => sendMessage(ts, queueUrl)));
            logger.info({
                method: "UpdateAwakeAiETDPortTimestamps.handler",
                tookMs: Date.now() - start
            });
        });
}
