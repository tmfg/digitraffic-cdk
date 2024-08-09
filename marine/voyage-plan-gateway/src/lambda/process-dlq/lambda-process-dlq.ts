import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { VoyagePlanEnvKeys } from "../../keys.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { SQSEvent, SQSRecord } from "aws-lambda";

import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client();

const bucketName = getEnvVariable(VoyagePlanEnvKeys.BUCKET_NAME);

export const handler = async (event: SQSEvent): Promise<void[]> => {
    const millis = new Date().getTime();

    logger.info({
        method: "vpgwProcessDLQ.handler",
        customDlqRecordsReceived: event.Records.length
    });

    const uploads = event.Records.map((e: SQSRecord, idx: number) =>
        uploadToS3(s3, bucketName, e.body, `route-${millis}-${idx}.json`)
    );

    return Promise.all(uploads);
};
