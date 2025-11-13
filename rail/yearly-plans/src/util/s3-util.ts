import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";


const s3Client = new S3Client({ region: "eu-west-1" });

export async function uploadCompressedDataToS3(
  bucketName: string,
  data: string,
  dataType: string
): Promise<string> {
  // 2025-11-13T12-00-01Z
  const timestamp = `${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}Z`;
  const key = `${dataType}/${dataType}.json.zip`;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  archive.on('error', (error) => {
    logException(logger, error);
    throw error;
  });

  archive.append(data, { name: `${dataType}-${timestamp}.json` });

  await archive.finalize();

  const zipBuffer = Buffer.concat(chunks);

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: zipBuffer,
    ContentType: "application/zip",
  }));

  return key;
}
