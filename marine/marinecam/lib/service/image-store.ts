import {S3} from "aws-sdk";
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import {writeFile} from 'fs/promises';

const BASE64 = 'base64';

export function storeImage(cameraId: string, image: string, bucketName: string) {
    const imageName = `${cameraId}.jpg`;

    console.info("storing image %s to s3 with size %d", cameraId, image.length);

    // for local testing
    if (bucketName === '') {
        console.info("storing image %s locally!", cameraId);
        // store to s3

        return writeFile(imageName, image, BASE64);
    } else {
        const keyName = `images/Saimaa/${imageName}`;

        const buffer = Buffer.from(image, BASE64);

        return uploadToS3(bucketName, buffer, keyName);
    }
}

export function uploadToS3(bucketName: string, body: Buffer, filename: string): Promise<ManagedUpload.SendData> {
    const s3 = new S3();
    return s3.upload({
        Bucket: bucketName,
        Body: body,
        Key: filename,
        ACL: 'private',
        CacheControl: 'max-age=120',
        ContentType: MediaType.IMAGE_JPEG,
    }).promise();
}
