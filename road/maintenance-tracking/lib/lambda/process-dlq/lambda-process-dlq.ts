import {uploadToS3} from "digitraffic-common/stack/s3-utils";
import {MaintenanceTrackingEnvKeys} from "../../keys";
const bucketName = process.env[MaintenanceTrackingEnvKeys.SQS_DLQ_BUCKET_NAME] as string;

export const handler = async (event: any): Promise<any> => {
    const iso = new Date().toISOString();

    console.error(`method=handleMaintenanceTrackingDlq receivedCount=${event.Records.length}`);
    const uploads = event.Records.map((e: any, idx: number) => {
        console.error(`method=handleMaintenanceTrackingDlq content: ${e.body}`);
        uploadToS3(bucketName, e.body, `${iso}-maintenanceTracking-${idx}.txt`);
    });
    return Promise.all(uploads);
};
