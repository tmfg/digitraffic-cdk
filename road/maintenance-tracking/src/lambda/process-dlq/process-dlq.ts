import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { MaintenanceTrackingEnvKeys } from "../../keys";
import { SQSEvent } from "aws-lambda";
import { SQSRecord } from "aws-lambda/trigger/sqs";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const bucketName = getEnvVariable(MaintenanceTrackingEnvKeys.SQS_DLQ_BUCKET_NAME);

export const handler = (event: SQSEvent): Promise<Awaited<void>[]> => {
    const iso = new Date().toISOString();

    logger.error({
        method: "MaintenanceTracking.processDlq",
        message: `received unhandled trackings`,
        customCount: event.Records.length
    });

    const uploads = event.Records.map(async (e: SQSRecord, idx: number) => {
        logger.error({
            method: "MaintenanceTracking.processDlq",
            message: `Load failed message to s3: ${bucketName}/${iso}-maintenanceTracking-${idx}.txt content: ${e.body}`
        });
        await uploadToS3(bucketName, e.body, `${iso}-maintenanceTracking-${idx}.txt`);
    });
    return Promise.all(uploads);
};
