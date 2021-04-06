const fs = require('fs');

export function storeImage(cameraId: string, image: string) {
    console.info("storing image %s to s3", cameraId);
    // store to s3

    fs.writeFileSync(cameraId + '.jpg', image, 'base64');
}