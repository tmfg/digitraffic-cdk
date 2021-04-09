import {uploadToS3} from "../../../../common/stack/s3-utils";
import {MediaType} from "../../../../common/api/mediatypes";

const BASE64 = 'base64';

export async function storeImage(cameraId: string, image: string, bucketName: string): Promise<any> {
    const imageName = `${cameraId}.jpg`;

    console.info("storing image %s to s3 with size %d", cameraId, image.length);

    // for local testing
    if(bucketName == '') {
        const fs = require('fs');

        console.info("storing image %s locally!", cameraId);
        // store to s3

        return fs.writeFileSync(imageName, image, BASE64);
    } else {
        const keyName = `images/saimaa/${imageName}`;

        const buffer = Buffer.from(image, BASE64);

        return await uploadToS3(bucketName, buffer, keyName, 'private', MediaType.IMAGE_JPEG);
    }
}