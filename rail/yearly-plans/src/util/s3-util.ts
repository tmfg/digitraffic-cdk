import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { file } from "zod";

const s3Client = new S3Client({ region: "eu-west-1" });

export async function uploadCompressedDataToS3(
  bucketName: string,
  data: string,
  filePath: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `${filePath}.zip`;

  // Create archive in memory
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  // Collect chunks as they're generated
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Handle errors
  archive.on('error', (err) => {
    throw err;
  });

  // Add JSON data to the archive
  archive.append(data, { name: `yearly-plans-${timestamp}.json` });

  // Finalize the archive (this triggers the 'data' events)
  await archive.finalize();

  // Combine all chunks into a single buffer
  const zipBuffer = Buffer.concat(chunks);

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: zipBuffer,
    ContentType: "application/zip",
  }));

  // eslint-disable-next-line no-console
  console.log(`Successfully uploaded data to S3: ${key}`);

  return key;
}
