import {uploadToS3} from "../../../../../common/stack/s3-utils";

export const BUCKET_NAME = 'BUCKET_NAME';
const bucketName = process.env[BUCKET_NAME] as string;

export const handler = async (event: any): Promise<any> => {
    const now = new Date();
    const iso = now.toISOString();
    const millis = now.getMilliseconds();

    console.info(`method=maintenanceTrackingProcessDLQ receivedCount=${event.Records.length}`);
    const uploads = event.Records.map((e: any, idx: number) =>
        uploadToS3(bucketName, e.body, `maintenanceTracking-${iso}-${millis}-${idx}.json`)
    );
    return Promise.all(uploads);
};
