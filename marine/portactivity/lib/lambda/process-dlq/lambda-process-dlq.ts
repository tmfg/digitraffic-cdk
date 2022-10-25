import {uploadToS3} from "@digitraffic/common/aws/runtime/s3";
import {getEnv} from "aws-cdk-lib/custom-resources/lib/provider-framework/runtime/util";
import {PortactivityEnvKeys} from "../../keys";

const bucketName = getEnv(PortactivityEnvKeys.BUCKET_NAME);

interface DlqEvent {
    readonly Records: {
        readonly body: string
    }[]
}

export const handler = async (event: DlqEvent): Promise<void> => {
    const millis = new Date().getTime();
    console.info(`method=portactivityTimestampsProcessDLQ portCallDLQRecordsReceived=${event.Records.length}`);
    const uploads = event.Records.map((e, idx: number) =>
        uploadToS3(bucketName, e.body, `timestamp-${millis}-${idx}.json`));
    await Promise.all(uploads);
};
