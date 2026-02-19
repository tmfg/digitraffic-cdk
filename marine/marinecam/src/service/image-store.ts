import { writeFile } from "node:fs/promises";
import type { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";

const BASE64 = "base64" as const;

const s3 = new S3Client();

export function storeImage(
  cameraId: string,
  image: string,
  bucketName: string,
): Promise<PutObjectCommandOutput | undefined> {
  const imageName = `${cameraId}.jpg`;

  logger.info({
    method: "ImageStore.storeImage",
    message: `Storing image ${cameraId} with size ${image.length}`,
  });

  // for local testing
  if (bucketName === "") {
    logger.info({
      method: "ImageStore.storeImage",
      message: `Storing image ${cameraId} locally!`,
    });
    writeFile(imageName, image, BASE64);
    return Promise.resolve(undefined);
  } else {
    // store to s3
    const keyName = `images/Saimaa/${imageName}`;

    const buffer = Buffer.from(image, BASE64);

    return uploadToS3(bucketName, buffer, keyName);
  }
}

export function uploadToS3(
  bucketName: string,
  body: Buffer,
  filename: string,
): Promise<PutObjectCommandOutput> {
  const upload = new PutObjectCommand({
    Bucket: bucketName,
    Body: body,
    Key: filename,
    ACL: "private",
    CacheControl: "max-age=120",
    ContentType: MediaType.IMAGE_JPEG,
  });

  return s3.send(upload);
}
