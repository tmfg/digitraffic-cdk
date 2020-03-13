import {S3} from "aws-sdk";

export function uploadToS3(
    bucketName: string,
    body: string,
    filename: string,
    cannedAcl: string
) {
    const s3 = new S3();
    return s3.upload({
        Bucket: bucketName,
        Body: body,
        Key: filename,
        ACL: cannedAcl
    }).promise();
}