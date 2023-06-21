import { getEnvVariable } from "@digitraffic/common/dist/utils/utils.js";
import { RamiEnvKeys } from "../../keys.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default.js";
import { uploadToS3 } from "../../util/s3.js";

const bucketName = getEnvVariable(RamiEnvKeys.SQS_DLQ_BUCKET_NAME);

interface DlqEvent {
    readonly Records: {
        readonly body: string;
    }[];
}

export const handler = async (event: DlqEvent): Promise<void> => {
    const millis = new Date().getTime();
    logger.info({
        method: "RAMI-ProcessDLQ.handler",
        customRamiDLQMessagesReceived: event.Records.length
    });
    const uploads = event.Records.map((e, idx: number) =>
        uploadToS3(bucketName, e.body, `message-${millis}-${idx}.json`)
    );
    await Promise.all(uploads);
};
