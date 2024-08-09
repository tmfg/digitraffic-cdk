import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type NodeJsRuntimeStreamingBlobPayloadInputTypes } from "@smithy/types";
import { logger } from "./dt-logger-default.mjs";

export async function uploadToS3(
    s3: S3Client,
    bucketName: string,
    body: NodeJsRuntimeStreamingBlobPayloadInputTypes,
    objectName: string,
    cannedAcl?: ObjectCannedACL,
    contentType?: string
) {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectName,
        Body: body,
        ACL: cannedAcl,
        ContentType: contentType,
    });
    try {
        await s3.send(command);
    } catch (error) {
        logger.error({
            method: "s3.uploadToS3",
            message: `upload failed to bucket ${bucketName}`,
        });
    }
}
