import { PutObjectCommand, type PutObjectCommandOutput, S3 } from "@aws-sdk/client-s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function uploadToS3(bucketName: string, body: string, objectName: string): Promise<void> {
    const s3 = new S3({});
    try {
        await doUpload(s3, bucketName, body, objectName);
    } catch (error) {
        logger.warn({
            method: "RAMI-ProcessDLQ.uploadToS3",
            message: `retrying upload to bucket ${bucketName}`
        });
        try {
            await doUpload(s3, bucketName, body, objectName);
        } catch (e2) {
            logger.error({
                method: "RAMI-ProcessDLQ.uploadToS3",
                message: `upload failed, retrying upload to bucket ${bucketName}`
            });
        }
    }
}

function doUpload(
    s3: S3,
    Bucket: string,
    Body: string,
    Key: string
): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({Bucket, Key, Body});
    
    return s3.send(command);
}
