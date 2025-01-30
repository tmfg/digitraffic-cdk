import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { PortactivityEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { S3Client } from "@aws-sdk/client-s3";

const bucketName = getEnvVariable(PortactivityEnvKeys.BUCKET_NAME);

interface DlqEvent {
  readonly Records: {
    readonly body: string;
  }[];
}

const s3 = new S3Client({});

export const handler = async (event: DlqEvent): Promise<void> => {
  const millis = new Date().getTime();
  logger.info({
    method: "PortactivityTimestampsProcessDLQ.handler",
    customPortcallDLQRecordsReceivedCount: event.Records.length,
  });
  const uploads = event.Records.map((e, idx: number) =>
    uploadToS3(s3, bucketName, e.body, `timestamp-${millis}-${idx}.json`)
  );
  await Promise.all(uploads);
};
