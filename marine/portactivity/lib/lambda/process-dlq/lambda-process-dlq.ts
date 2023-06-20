import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { PortactivityEnvKeys } from "../../keys";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const bucketName = getEnvVariable(PortactivityEnvKeys.BUCKET_NAME);

interface DlqEvent {
    readonly Records: {
        readonly body: string;
    }[];
}

export const handler = async (event: DlqEvent): Promise<void> => {
    const millis = new Date().getTime();
    logger.info({
        method: "PortactivityTimestampsProcessDLQ.handler",
        customPortcallDLQRecordsReceivedCount: event.Records.length
    });
    const uploads = event.Records.map((e, idx: number) =>
        uploadToS3(bucketName, e.body, `timestamp-${millis}-${idx}.json`)
    );
    await Promise.all(uploads);
};
