import * as S3Utils from "@digitraffic/common/dist/aws/runtime/s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client();
export class RtzStorageApi {
    private readonly bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    async storeVoyagePlan(voyagePlan: string): Promise<void> {
        logger.info({
            method: "RtzStorageApi.storeVoyagePlan",
            message: "Storing RTZ voyage plan"
        });

        const objectName = `voyageplan-${new Date().toISOString()}.xml`;
        await S3Utils.uploadToS3(s3, this.bucketName, voyagePlan, objectName);

        logger.info({
            method: "RtzStorageApi.storeVoyagePlan",
            message: "RTZ storage complete"
        });
    }
}
