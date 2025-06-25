import {
  PutObjectCommand,
  type PutObjectCommandOutput,
  S3,
} from "@aws-sdk/client-s3";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import ky, { HTTPError } from "ky";

const SERVICE = "UpdateService";
export async function handleMetadataUpdate(
  url: string,
  apikey: string,
  bucketName: string,
  filename: string,
): Promise<void> {
  const start = Date.now();

  logger.info({
    method: `${SERVICE}.handleMetadataUpdate`,
    message: `fetch url=${url}`,
  });

  try {
    const resp = await getFromServer(url, apikey);
    // Store to bucket
    const s3 = new S3({});
    await doUploadToS3(s3, bucketName, resp, filename);
  } catch (error) {
    logger.error({
      method: `${SERVICE}.handleMetadataUpdate`,
      message: `update failed`,
      error,
    });
    throw error;
  } finally {
    logger.info({
      method: `${SERVICE}.handleMetadataUpdate`,
      message: `update file=${filename}`,
      tookMs: Date.now() - start,
    });
  }
}

function doUploadToS3(
  s3: S3,
  bucketName: string,
  body: string,
  fileName: string,
): Promise<PutObjectCommandOutput> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: body,
  });
  return s3.send(command).catch((error: Error) => {
    logger.error({
      method: `${SERVICE}.doUploadToS3`,
      message: `s3.send with file=${fileName} failed`,
      error,
    });
    throw error;
  });
}

async function getFromServer(url: string, apikey: string): Promise<string> {
  const start = Date.now();

  try {
    const result = await ky.get<ServerResponse>(url, {
      headers: {
        Accept: "application/json",
        "x-api-key": apikey,
      },
    });
    if (result.status !== 200) {
      logger.error({
        method: `${SERVICE}.getFromServer`,
        message:
          `url=${url} failed with return code ${result.status} and data ${
            JSON.stringify(
              await result.json(),
            )
          }`,
      });
      return Promise.reject();
    }
    return JSON.stringify(await result.json());
  } catch (error) {
    if (error instanceof HTTPError) {
      const response = error.response;
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      logger.error({
        method: `${SERVICE}.getFromServer`,
        message:
          `url=${url} failed with return code ${response.status} and data ${
            JSON.stringify(errorBody)
          }`,
        error,
      });
    } else {
      // set up failed
      logger.error({
        method: `${SERVICE}.getFromServer`,
        message: `url=${url} failed with error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error,
      });
    }
    return Promise.reject();
  } finally {
    logger.info({
      method: `${SERVICE}.getFromServer`,
      message: `url=${url}`,
      tookMs: Date.now() - start,
    });
  }
}

interface ServerResponse {
  readonly status: number;
  readonly statusText: string;
  readonly data: object;
}
