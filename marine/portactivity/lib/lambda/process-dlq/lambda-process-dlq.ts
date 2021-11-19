import {uploadToS3} from "digitraffic-common/stack/s3-utils";

export const BUCKET_NAME = 'BUCKET_NAME';
const bucketName = process.env[BUCKET_NAME] as string;

type DlqEvent = {
    readonly Records: {
        readonly body: string
    }[]
}

export const handler = async (event: DlqEvent): Promise<void> => {
    const millis = new Date().getTime();
    console.info(`method=portactivityTimestampsProcessDLQ portCallDLQRecordsReceived=${event.Records.length}`);
    const uploads = event.Records.map((e, idx: number) =>
        uploadToS3(bucketName, e.body, `timestamp-${millis}-${idx}.json`)
    );
    await Promise.all(uploads);
};
