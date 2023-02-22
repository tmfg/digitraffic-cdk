import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { S3 } from "aws-sdk";
import axios, { AxiosError, AxiosResponse } from "axios";

export async function handleMetadataUpdate(
    url: string,
    apikey: string,
    s3: string,
    filename: string
) {
    const start = Date.now();

    console.info("method=handleMetadataUpdate fetch url=%s", url);

    try {
        const resp = await getFromServer(url, apikey);

        // Store to bucket
        await uploadToS3Internal(s3, resp, filename).catch((err) => {
            console.error(
                "method=handleMetadataUpdate file=%s failed=%o",
                filename,
                err
            );
        });
    } catch (err) {
        console.error("method=handleMetadataUpdate unexpected error", err);
    } finally {
        console.info(
            "method=handleMetadataUpdate file=%s tookMs=%d",
            filename,
            Date.now() - start
        );
    }
}

function uploadToS3Internal(
    bucketName: string,
    body: S3.Body,
    filename: string
): Promise<void> {
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
                "x-api-key": apikey,
            },
            validateStatus: function (status) {
                return status === 200;
            },
        });

        return JSON.stringify(result.data);
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                // error response
                const response = error.response as AxiosResponse;
                console.error(
                    "method=getFromServer url=%s failed with return code %d and data %s",
                    url,
                    response.status,
                    response.data
                );
            } else if (error.request) {
                // no response from server
                console.error(
                    "method=getFromServer url=%s failed with no response %s",
                    url,
                    error.request
                );
            } else {
                // set up failed
                console.error(
                    "method=getFromServer url=%s failed in setup %s",
                    url,
                    error.message
                );
            }
        } else {
            console.error("method=getFromServer url=%s failed %s", url, error);
        }
        return Promise.reject();
    } finally {
        console.info(
            "method=getFromServer url=%s tookMs=%d",
            url,
            Date.now() - start
        );
    }
}

interface ServerResponse {
    readonly status: number;
    readonly statusText: string;
    readonly data: object;
}
