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
    customRamiDLQMessagesReceived: event.Records.length,
  });

  const uploads = event.Records.map((e, idx: number) => {
    logger.debug("event " + JSON.stringify(e));

    try {
      const dlqMessage = JSON.parse(e.body) as DlqMessage;
      const body = `[{"errors":"${dlqMessage.errors}"}, ${
        JSON.stringify(dlqMessage.message)
      }]`;
      const folder = `${dlqMessage.messageType}/${
        new Date().toISOString().substring(0, 10)
      }`;
      const fileName = `${folder}/message-${millis}-${idx}.json`;

      logger.debug("Uploading to " + fileName);

      return uploadToS3(bucketName, body, fileName);
    } catch (error) {
      logException(logger, error);

      return Promise.resolve();
    }
  });

  await Promise.allSettled(uploads);
};
