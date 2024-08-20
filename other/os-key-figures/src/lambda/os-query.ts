import "source-map-support/register";
import * as AWSx from "aws-sdk";
import { retryRequest } from "@digitraffic/common/dist/utils/retry";
import { HttpError } from "@digitraffic/common/dist/types/http-error";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { IncomingMessage } from "http";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { SignatureV4 } from "@smithy/signature-v4";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const AWS = AWSx as any;

function handleResponseFromOs(
    successCallback: (result: Record<string, unknown>) => void,
    failedCallback: (code: number, message: string) => void
) {
    return (httpResp: IncomingMessage) => {
        const statusCode = httpResp.statusCode;
        logger.info({
            message: `OpenSearch responded with status code ${statusCode}`,
            method: "os-query.handleResponseFromEs"
        });
        if (statusCode && (statusCode < 200 || statusCode >= 300)) {
            failedCallback(
                statusCode,
                `OpenSearch responded with status code ${httpResp.statusCode}. The error message was: ${httpResp.statusMessage}`
            );
            return;
        }
        let respBody = "";
        httpResp.on("data", function (chunk: any) {
            respBody += chunk;
        });
        httpResp.on("end", function (chunk: any) {
            try {
                successCallback(JSON.parse(respBody));
            } catch (e) {
                logger.info({
                    message: `Failed to parse response body: ${respBody}`,
                    method: "os-query.handleResponseFromEs"
                });
            }
        });
    };
}

async function signOsRequest(request: HttpRequest, credentials: AwsCredentialIdentity) {
    const signer = new SignatureV4({
        credentials,
        region: "eu-west-1",
        service: "es",
        sha256: Sha256
    });

    const signedRequest = (await signer.sign(request)) as HttpRequest;
    return signedRequest;
}

function createRequestForOs(vpcEndpoint: string, osEndpoint: string, query: string, path: string): HttpRequest {
    const index = "ft-digitraffic-access*";

    const request = new HttpRequest({
        method: "POST",
        path: `/${index}/${path}`,
        protocol: "https",
        body: query,
        hostname: vpcEndpoint,
        headers: {
            "Content-Type": "application/json",
            host: osEndpoint
        }
    });
    return request;
}

function handleRequest(client: any, req: any, callback: any) {
    client.handleRequest(req, null, callback, function (err: Error) {
        logger.error({
            message: "Error: " + err.message,
            method: "os-query.handleRequest"
        });
    });
}

export async function fetchDataFromOs(vpcEndpoint: string, osEndpoint: string,, query: string, path: string, credentials: AwsCredentialIdentity): Promise<any> {
    
    const request = createRequestForOs(vpcEndpoint, osEndpoint, query, path);

    const signedRequest = await signOsRequest(request, credentials);

    const client = new NodeHttpHandler();



    const makeRequest = async (): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            const callback = handleResponseFromOs(
                (result) => {
                    resolve(result);
                },
                (code, message) => {
                    reject(new HttpError(code, message));
                }
            );
            const { response } = await client.handle(signedRequest);
            handleRequest(client, req, callback);
        });
    };
    try {
        return await retryRequest(makeRequest);
    } catch (error: unknown) {
        logger.error({
            message: `Request failed: ${error instanceof Error && error.message}`,
            method: "os-query.fetchDataFromOs"
        });
        throw error;
    }
}
