import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { RamiEnvKeys } from "../../keys.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { uploadToS3 } from "../../util/s3.js";
import { logException } from "@digitraffic/common/dist/utils/logging";
import type { DlqMessage } from "../../model/dlq-message.js";

const bucketName = getEnvVariable(RamiEnvKeys.SQS_DLQ_BUCKET_NAME);

interface DlqEvent {
  readonly Records: {
    readonly body: string;
  }[];
}

export const handler = async (event: DlqEvent): Promise<void> => {
    const millis = new Date().getTime();
    logger.info({
        method: "RAMI-ProcessDLQ.handler",
        customRamiDLQMessagesReceived: event.Records.length
    });

    const uploads = event.Records.map((e, idx: number) => {
        const dlqMessage = JSON.parse(e.body) as DlqMessage;
        const body = `[{"errors":"${dlqMessage.errors}"}, ${JSON.stringify(dlqMessage.message)}]`
        const fileName = `${dlqMessage.messageType}/message-${millis}-${idx}.json`;

        return uploadToS3(bucketName, body, fileName)
    });

    await Promise.allSettled(uploads).catch((error): void => {
        logException(logger, error);
    });
};
