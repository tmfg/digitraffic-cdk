import {uploadToS3} from "@digitraffic/common/aws/runtime/s3";
import {VoyagePlanEnvKeys} from "../../keys";

const bucketName = process.env[VoyagePlanEnvKeys.BUCKET_NAME] as string;

export const handler = async (event: any): Promise<any> => {
    const millis = new Date().getTime();
    console.info(`method=vpgwProcessDLQ dlqRecordsReceived=${event.Records.length}`);
    const uploads = event.Records.map((e: any, idx: number) =>
        uploadToS3(bucketName, e.body, `route-${millis}-${idx}.json`));
    return Promise.all(uploads);
};
