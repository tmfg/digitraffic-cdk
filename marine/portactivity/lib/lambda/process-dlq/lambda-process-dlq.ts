import {uploadToS3} from "../../../../../common/stack/s3-utils";

export const BUCKET_NAME = 'BUCKET_NAME';
const bucketName = process.env[BUCKET_NAME] as string;

export const handler = async (event: any): Promise<any> => {
    const millis = new Date().getTime();
    console.info(`method=portactivityTimestampsProcessDLQ portCallDLQRecordsReceived=${event.Records.length}`);
    const uploads = event.Records.map((e: any, idx: number) =>
        uploadToS3(bucketName, e.body, `timestamp-${millis}-${idx}.json`)
    );
    return Promise.all(uploads);
};
