import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { VoyagePlanEnvKeys } from "../../keys";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { SQSEvent, SQSRecord } from "aws-lambda";

const bucketName = getEnvVariable(VoyagePlanEnvKeys.BUCKET_NAME);

export const handler = async (event: SQSEvent): Promise<void[]> => {
    const millis = new Date().getTime();

    logger.info({
        method: "vpgwProcessDLQ.handler",
        customDlqRecordsReceived: event.Records.length
    });

    const uploads = event.Records.map((e: SQSRecord, idx: number) =>
        uploadToS3(bucketName, e.body, `route-${millis}-${idx}.json`)
    );

    return Promise.all(uploads);
};
