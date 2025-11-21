import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "eu-west-1" });

export async function uploadDataToS3(
  bucketName: string,
  data: string,
  dataType: string,
): Promise<string> {
  const key = `${dataType}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: "application/json",
    }),
  );

  return key;
}
