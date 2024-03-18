import { PutObjectCommand, type PutObjectCommandOutput, S3 } from "@aws-sdk/client-s3";
import axios, { AxiosError } from "axios";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const SERVICE = "UpdateService";
export async function handleMetadataUpdate(
    url: string,
    apikey: string,
    bucketName: string,
    filename: string
): Promise<void> {
    const start = Date.now();

    logger.info({
        method: `${SERVICE}.handleMetadataUpdate`,
        message: `fetch url=${url}`
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
            error
        });
        throw error;
    } finally {
        logger.info({
            method: `${SERVICE}.handleMetadataUpdate`,
            message: `update file=${filename}`,
            tookMs: Date.now() - start
        });
    }
}

function doUploadToS3(
    s3: S3,
    bucketName: string,
    body: string,
    fileName: string
): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: body
    });
    return s3.send(command).catch((error: Error) => {
        logger.error({
            method: `${SERVICE}.doUploadToS3`,
            message: `s3.send with file=${fileName} failed`,
            error
        });
        throw error;
    });
}

async function getFromServer(url: string, apikey: string): Promise<string> {
    const start = Date.now();

    try {
        const result = await axios.get<ServerResponse>(url, {
            headers: {
                Accept: "application/json",
                "x-api-key": apikey
            },
            validateStatus: function (status: number) {
                return status === 200;
            }
        });

        return JSON.stringify(result.data);
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                // error response
                const response = error.response;
                logger.error({
                    method: `${SERVICE}.getFromServer`,
                    message: `url=${url} failed with return code ${response.status} and data ${JSON.stringify(
                        response.data
                    )}`,
                    error
                });
            } else if (error.request) {
                // no response from server
                logger.error({
                    method: `${SERVICE}.getFromServer`,
                    message: `url=${url} failed with no response ${JSON.stringify(error.request)}`,
                    error
                });
            } else {
                // set up failed
                logger.error({
                    method: `${SERVICE}.getFromServer`,
                    message: `url=${url} failed in setup ${error.message}`,
                    error
                });
            }
        } else {
            logger.error({
                method: `${SERVICE}.getFromServer`,
                message: `update failed`,
                error
            });
        }
        return Promise.reject();
    } finally {
        logger.info({
            method: `${SERVICE}.getFromServer`,
            message: `url=${url}`,
            tookMs: Date.now() - start
        });
    }
}

interface ServerResponse {
    readonly status: number;
    readonly statusText: string;
    readonly data: object;
}
