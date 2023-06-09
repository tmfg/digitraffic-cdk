import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { S3 } from "aws-sdk";
import axios, { AxiosError } from "axios";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const SERVICE = "UpdateService";
export async function handleMetadataUpdate(
    url: string,
    apikey: string,
    s3: string,
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
        await uploadToS3Internal(s3, resp, filename).catch((error: Error) => {
            logger.error({
                method: `${SERVICE}.handleMetadataUpdate`,
                message: `uploadToS3Internal file=${filename} failed`,
                error
            });
            throw error;
        });
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

function uploadToS3Internal(bucketName: string, body: S3.Body, filename: string): Promise<void> {
    return uploadToS3(
        bucketName,
        body,
        filename,
        "private", // cannedAcl
        MediaType.APPLICATION_JSON
    );
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
