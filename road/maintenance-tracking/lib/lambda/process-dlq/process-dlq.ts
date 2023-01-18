import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { MaintenanceTrackingEnvKeys } from "../../keys";
import { SQSEvent } from "aws-lambda";
import { SQSRecord } from "aws-lambda/trigger/sqs";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";

const bucketName = getEnvVariable(
    MaintenanceTrackingEnvKeys.SQS_DLQ_BUCKET_NAME
);

export const handler = (event: SQSEvent) => {
    const iso = new Date().toISOString();

    console.error(
        `method=handleMaintenanceTrackingDlq receivedCount=${event.Records.length}`
    );
    const uploads = event.Records.map(async (e: SQSRecord, idx: number) => {
        console.error(`method=handleMaintenanceTrackingDlq content: ${e.body}`);
        await uploadToS3(
            bucketName,
            e.body,
            `${iso}-maintenanceTracking-${idx}.txt`
        );
    });
    return Promise.all(uploads);
};
