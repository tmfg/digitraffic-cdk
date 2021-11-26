import {S3} from "aws-sdk";

export async function uploadToS3<Body>(
    bucketName: string,
    body: Body,
    objectName: string,
    cannedAcl?: string,
    contentType?: string) {

    const s3 = new S3();
    try {
        await doUpload(s3, bucketName, body, objectName, cannedAcl, contentType);
    } catch (error) {
        console.warn('method=uploadToS3 retrying upload to bucket %s', bucketName);
        try {
            await doUpload(s3, bucketName, body, objectName, cannedAcl, contentType);
        } catch (error) {
            console.error('method=uploadToS3 failed retrying upload to bucket %s', bucketName);
        }
    }
}

function doUpload<Body>(
    s3: S3,
    bucketName: string,
    body: Body,
    filename: string,
    cannedAcl?: string,
    contentType?: string) {

    return s3.upload({
        Bucket: bucketName,
        Body: body,
        Key: filename,
        ACL: cannedAcl,
        ContentType: contentType
    }).promise();
}
