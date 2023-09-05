import { PutObjectCommand, PutObjectCommandOutput, PutObjectRequest, S3 } from "@aws-sdk/client-s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function uploadToS3<Body extends PutObjectRequest["Body"] | undefined>(
    bucketName: string,
    body: Body,
    objectName: string
): Promise<void> {
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

function doUpload<Body extends PutObjectRequest["Body"] | undefined>(
    s3: S3,
    bucketName: string,
    body: Body,
    fileName: string
): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: body
    });
    return s3.send(command);
}
